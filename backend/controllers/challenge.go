package controllers

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"pwnthemall/config"
	"pwnthemall/debug"
	"pwnthemall/models"
	"pwnthemall/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/minio/minio-go/v7"
	"gorm.io/gorm"
)

func GetChallenges(c *gin.Context) {
	var challenges []models.Challenge
	result := config.DB.Where("hidden = false").Find(&challenges)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, challenges)
}

func GetChallenge(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	result := config.DB.First(&challenge, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}
	c.JSON(http.StatusOK, challenge)
}

func GetChallengesByCategoryName(c *gin.Context) {
	categoryName := c.Param("category")

	userI, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, ok := userI.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user_wrong_type"})
		return
	}

	// Check CTF timing - only allow access if CTF has started or user is admin
	if !config.IsCTFStarted() && user.Role != "admin" {
		c.JSON(http.StatusOK, []interface{}{}) // Return empty array instead of error
		return
	}

	var challenges []models.Challenge
	result := config.DB.
		Preload("ChallengeCategory").
		Preload("ChallengeType").
		Preload("ChallengeDifficulty").
		Joins("JOIN challenge_categories ON challenge_categories.id = challenges.challenge_category_id").
		Where("challenge_categories.name = ? and hidden = false", categoryName).
		Find(&challenges)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// Get solved challenges for the user's team
	var solvedChallengeIds []uint
	if user.Team != nil {
		var solves []models.Solve
		if err := config.DB.Where("team_id = ?", user.Team.ID).Find(&solves).Error; err == nil {
			for _, solve := range solves {
				solvedChallengeIds = append(solvedChallengeIds, solve.ChallengeID)
			}
		}
	}

	// Create response with solved status
	type ChallengeWithSolved struct {
		models.Challenge
		Solved      bool     `json:"solved"`
		GeoRadiusKm *float64 `json:"geoRadiusKm,omitempty"`
	}

	var challengesWithSolved []ChallengeWithSolved
	for _, challenge := range challenges {
		solved := false
		for _, solvedId := range solvedChallengeIds {
			if challenge.ID == solvedId {
				solved = true
				break
			}
		}
		item := ChallengeWithSolved{Challenge: challenge, Solved: solved}
		if challenge.ChallengeType != nil && strings.ToLower(challenge.ChallengeType.Name) == "geo" {
			var spec models.GeoSpec
			if err := config.DB.Where("challenge_id = ?", challenge.ID).First(&spec).Error; err == nil {
				r := spec.RadiusKm
				item.GeoRadiusKm = &r
			}
		}
		challengesWithSolved = append(challengesWithSolved, item)
	}

	c.JSON(http.StatusOK, challengesWithSolved)
}

func CreateChallenge(c *gin.Context) {
	const maxSizePerFile = 1024 * 1024 * 256 // 256 MB

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read file"})
		return
	}
	defer file.Close()

	if !strings.HasSuffix(strings.ToLower(header.Filename), ".zip") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only .zip files are allowed"})
		return
	}

	buf := new(bytes.Buffer)
	if _, err := io.CopyN(buf, file, maxSizePerFile); err != nil && err != io.EOF {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Zip archive too large"})
		return
	}

	r, err := zip.NewReader(bytes.NewReader(buf.Bytes()), int64(buf.Len()))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid zip archive"})
		return
	}

	filename := header.Filename
	slug := strings.TrimSuffix(filename, filepath.Ext(filename))
	bucketName := "challenges"
	ctx := context.Background()

	prefix := ""
	if len(r.File) > 0 {
		first := r.File[0].Name
		if idx := strings.Index(first, "/"); idx != -1 {
			prefix = first[:idx+1]
		}
	}

	foundChallYml := false
	for _, f := range r.File {
		normalized := strings.TrimPrefix(f.Name, prefix)
		if strings.ToLower(normalized) == "chall.yml" {
			foundChallYml = true
			break
		}
	}

	if !foundChallYml {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing chall.yml in archive"})
		return
	}

	for _, f := range r.File {
		if f.FileInfo().IsDir() {
			continue
		}

		cleanPath := filepath.ToSlash(strings.TrimPrefix(f.Name, prefix))
		if strings.Contains(cleanPath, "..") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file path in archive"})
			return
		}

		fc, err := f.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read zip content"})
			return
		}

		var fileBuf bytes.Buffer
		if _, err := io.CopyN(&fileBuf, fc, maxSizePerFile); err != nil && err != io.EOF {
			fc.Close()
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("File %s is too large", f.Name)})
			return
		}
		fc.Close()

		if fileBuf.Len() == 0 {
			continue
		}

		objectPath := slug + "/" + cleanPath

		_, err = config.FS.PutObject(ctx, bucketName, objectPath, bytes.NewReader(fileBuf.Bytes()), int64(fileBuf.Len()), minio.PutObjectOptions{
			ContentType: http.DetectContentType(fileBuf.Bytes()),
		})

		if err != nil {
			log.Printf("Failed to upload %s: %v", objectPath, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file to MinIO"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Challenge uploaded", "slug": slug})
}

type FlagInput struct {
	Flag string `json:"flag" binding:"required"`
}

// GeoFlagInput allows geo submissions: { lat, lng }
type GeoFlagInput struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

func SubmitChallenge(c *gin.Context) {
	var challenge models.Challenge

	challengeId := c.Param("id")
	if err := config.DB.Preload("Flags").Preload("ChallengeType").Where("id = ?", challengeId).First(&challenge).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
		return
	}

	var inputRaw map[string]interface{}
	if err := c.ShouldBindJSON(&inputRaw); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_input"})
		return
	}

	userI, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, ok := userI.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user_wrong_type"})
		return
	}

	// Block all users (including admins) from submitting if not in a team
	if user.Team == nil || user.TeamID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "team_required_to_submit"})
		return
	}

	// Check CTF timing - block flag submission when CTF hasn't started or has ended
	ctfStatus := config.GetCTFStatus()
	if ctfStatus == config.CTFNotStarted {
		c.JSON(http.StatusForbidden, gin.H{"error": "flag_submission_not_available_yet"})
		return
	}
	if ctfStatus == config.CTFEnded {
		c.JSON(http.StatusForbidden, gin.H{"error": "flag_submission_no_longer_available"})
		return
	}

	// Check if team has already solved this challenge
	var existingSolve models.Solve
	if err := config.DB.Where("team_id = ? AND challenge_id = ?", user.Team.ID, challenge.ID).First(&existingSolve).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "challenge_already_solved"})
		return
	}

	submittedValue := ""
	if v, ok := inputRaw["flag"]; ok {
		if s, ok := v.(string); ok {
			submittedValue = s
		}
	}
	if submittedValue == "" {
		// Maybe geo submission
		if latV, ok := inputRaw["lat"].(float64); ok {
			if lngV, ok2 := inputRaw["lng"].(float64); ok2 {
				submittedValue = fmt.Sprintf("geo:%f,%f", latV, lngV)
			}
		}
	}

	var submission models.Submission
	if err := config.DB.FirstOrCreate(&submission, models.Submission{Value: submittedValue, UserID: user.ID, ChallengeID: challenge.ID}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "submission_create_failed"})
	}

	found := false
	// Standard flag check and geo check
	for _, flag := range challenge.Flags {
		if utils.IsGeoFlag(flag.Value) {
			// Compare against a geo submission
			if lat, lng, rad, ok := utils.ParseGeoSpecFromHashed(flag.Value); ok {
				if v, ok := inputRaw["lat"].(float64); ok {
					if w, ok2 := inputRaw["lng"].(float64); ok2 {
						if utils.IsWithinRadiusKm(lat, lng, v, w, rad) {
							found = true
							break
						}
					}
				}
			}
		} else if submittedValue != "" && flag.Value == utils.HashFlag(submittedValue) {
			found = true
			break
		} else if v, ok := inputRaw["flag"].(string); ok && flag.Value == utils.HashFlag(v) {
			found = true
			break
		}
	}

	// If not found yet and challenge is geo, validate against stored GeoSpec
	if !found && challenge.ChallengeType != nil && strings.ToLower(challenge.ChallengeType.Name) == "geo" {
		if v, ok := inputRaw["lat"].(float64); ok {
			if w, ok2 := inputRaw["lng"].(float64); ok2 {
				var spec models.GeoSpec
				if err := config.DB.Where("challenge_id = ?", challenge.ID).First(&spec).Error; err == nil {
					if utils.IsWithinRadiusKm(spec.TargetLat, spec.TargetLng, v, w, spec.RadiusKm) {
						found = true
					}
				}
			}
		}
	}
	if found {
		var solve models.Solve
		if err := config.DB.FirstOrCreate(&solve,
			models.Solve{
				TeamID:      user.Team.ID,
				ChallengeID: challenge.ID,
				UserID:      user.ID,
				Points:      challenge.Points,
			}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "solve_create_failed"})
			return
		} else {
			// Broadcast team solve event over WebSocket
			type TeamSolveEvent struct {
				Event         string    `json:"event"`
				TeamID        uint      `json:"teamId"`
				ChallengeID   uint      `json:"challengeId"`
				ChallengeName string    `json:"challengeName"`
				Points        int       `json:"points"`
				UserID        uint      `json:"userId"`
				Username      string    `json:"username"`
				Timestamp     time.Time `json:"timestamp"`
			}
			event := TeamSolveEvent{
				Event:         "team_solve",
				TeamID:        user.Team.ID,
				ChallengeID:   challenge.ID,
				ChallengeName: challenge.Name,
				Points:        challenge.Points,
				UserID:        user.ID,
				Username:      user.Username,
				Timestamp:     time.Now().UTC(),
			}
			if WebSocketHub != nil {
				if payload, err := json.Marshal(event); err == nil {
					WebSocketHub.SendToTeamExcept(user.Team.ID, user.ID, payload)
				}
			}

			// Best-effort: stop any running instance for this team and challenge when solved
			go func(teamID uint, chalID uint, actorID uint, actorName string) {
				var instance models.Instance
				if err := config.DB.Where("team_id = ? AND challenge_id = ?", teamID, chalID).First(&instance).Error; err == nil {
					// Try stopping the container
					if instance.Container != "" {
						if err := utils.StopDockerInstance(instance.Container); err != nil {
							log.Printf("Failed to stop Docker instance on solve: %v", err)
						}
					}
					// Remove instance record to free the slot
					if err := config.DB.Delete(&instance).Error; err != nil {
						log.Printf("Failed to delete instance on solve: %v", err)
					}

					// Notify team listeners that instance stopped
					if WebSocketHub != nil {
						type InstanceEvent struct {
							Event       string    `json:"event"`
							TeamID      uint      `json:"teamId"`
							UserID      uint      `json:"userId"`
							Username    string    `json:"username"`
							ChallengeID uint      `json:"challengeId"`
							Status      string    `json:"status"`
							UpdatedAt   time.Time `json:"updatedAt"`
						}
						evt := InstanceEvent{
							Event:       "instance_update",
							TeamID:      teamID,
							UserID:      actorID,
							Username:    actorName,
							ChallengeID: chalID,
							Status:      "stopped",
							UpdatedAt:   time.Now().UTC(),
						}
						if payload, err := json.Marshal(evt); err == nil {
							WebSocketHub.SendToTeamExcept(teamID, actorID, payload)
						}
					}
				}
			}(user.Team.ID, challenge.ID, user.ID, user.Username)

			c.JSON(http.StatusOK, gin.H{"message": "challenge_solved"})
			return
		}
	} else {
		if challenge.ChallengeType != nil && strings.ToLower(challenge.ChallengeType.Name) == "geo" {
			c.JSON(http.StatusForbidden, gin.H{"result": "incorrect_location"})
		} else {
			c.JSON(http.StatusForbidden, gin.H{"result": "wrong_flag"})
		}
	}
}

func GetChallengeSolves(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	result := config.DB.First(&challenge, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}

	// Get solves with team information
	var solves []models.Solve
	result = config.DB.
		Preload("Team").
		Where("challenge_id = ?", challenge.ID).
		Order("created_at ASC").
		Find(&solves)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// Create response with user information
	type SolveWithUser struct {
		models.Solve
		UserID   uint   `json:"userId"`
		Username string `json:"username"`
	}

	var solvesWithUsers []SolveWithUser

	for _, solve := range solves {
		// Find the submission that led to this solve
		var submission models.Submission
		submissionResult := config.DB.
			Preload("User").
			Where("challenge_id = ? AND user_id IN (SELECT id FROM users WHERE team_id = ?) AND created_at <= ?",
				challenge.ID, solve.TeamID, solve.CreatedAt).
			Order("created_at DESC").
			First(&submission)

		solveWithUser := SolveWithUser{
			Solve: solve,
		}

		if submissionResult.Error == nil && submission.User != nil {
			solveWithUser.UserID = submission.UserID
			solveWithUser.Username = submission.User.Username
		}

		solvesWithUsers = append(solvesWithUsers, solveWithUser)
	}

	c.JSON(http.StatusOK, solvesWithUsers)
}

func BuildChallengeImage(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	result := config.DB.Preload("ChallengeType").First(&challenge, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
		return
	}

	// Check if challenge is of type docker
	if challenge.ChallengeType.Name != "docker" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "challenge_not_docker_type"})
		return
	}
	_, err := utils.BuildDockerImage(challenge.Slug)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Successfully built image for challenge %s", challenge.Slug),
	})
}

func StartChallengeInstance(c *gin.Context) {
	id := c.Param("id")
	debug.Log("Starting instance for challenge ID: %s", id)

	var challenge models.Challenge
	result := config.DB.Preload("ChallengeType").First(&challenge, id)

	if result.Error != nil {
		debug.Log("Challenge not found with ID %s: %v", id, result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
		return
	}

	// Check if challenge is of type docker
	if challenge.ChallengeType.Name != "docker" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "challenge_not_docker_type"})
		return
	}

	imageName, exists := utils.IsImageBuilt(challenge.Slug)
	if !exists {
		// Check if Docker connection is available before attempting to build
		if err := utils.EnsureDockerClientConnected(); err != nil {
			debug.Log("Docker connection failed for challenge %s: %v", challenge.Slug, err)
			c.JSON(http.StatusServiceUnavailable, gin.H{
				"error":   "docker_unavailable",
				"message": "Docker service is currently unavailable. Please try again later or contact an administrator.",
			})
			return
		}

		var err error
		imageName, err = utils.BuildDockerImage(challenge.Slug)
		if err != nil {
			debug.Log("Docker build failed for challenge %s: %v", challenge.Slug, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "docker_build_failed"})
			return
		}
		debug.Log("Image built successfully: %s", imageName)
	}

	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var dockerConfig models.DockerConfig
	if err := config.DB.First(&dockerConfig).Error; err != nil {
		debug.Log("Docker config not found: %v", err)
		debug.Log("This might be due to missing environment variables or database seeding issues")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "docker_config_not_found"})
		return
	}

	var user models.User
	if err := config.DB.Preload("Team").First(&user, userID).Error; err != nil {
		debug.Log("User not found with ID %v: %v", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}

	if user.Team == nil || user.TeamID == nil {
		debug.Log("User has no team: Team=%v, TeamID=%v", user.Team, user.TeamID)
		c.JSON(http.StatusForbidden, gin.H{"error": "team_required"})
		return
	}

	// Cooldown enforcement: prevent immediate restart after a stop by any team member
	if dockerConfig.InstanceCooldownSeconds > 0 {
		var cd models.InstanceCooldown
		if err := config.DB.Where("team_id = ? AND challenge_id = ?", *user.TeamID, challenge.ID).First(&cd).Error; err == nil {
			elapsed := time.Since(cd.LastStoppedAt)
			remaining := time.Duration(dockerConfig.InstanceCooldownSeconds)*time.Second - elapsed
			if remaining > 0 {
				c.JSON(http.StatusTooEarly, gin.H{
					"error":             "instance_cooldown_not_elapsed",
					"remaining_seconds": int(remaining.Seconds()),
				})
				return
			}
		}
	}

	var countExist int64
	config.DB.Model(&models.Instance{}).
		Where("team_id = ? AND challenge_id = ?", user.Team.ID, challenge.ID).
		Count(&countExist)
	if int(countExist) >= 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "instance_already_running"})
		return
	}

	var countUser int64
	config.DB.Model(&models.Instance{}).
		Where("user_id = ?", user.ID).
		Count(&countUser)
	if int(countUser) >= dockerConfig.InstancesByUser {
		c.JSON(http.StatusForbidden, gin.H{"error": "max_instances_by_user_reached"})
		return
	}

	var countTeam int64
	config.DB.Model(&models.Instance{}).
		Where("team_id = ?", user.Team.ID).
		Count(&countTeam)
	if int(countTeam) >= dockerConfig.InstancesByTeam {
		c.JSON(http.StatusForbidden, gin.H{"error": "max_instances_by_team_reached"})
		return
	}

	portCount := len(challenge.Ports)
	if portCount == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no_ports_defined_for_challenge"})
		return
	}

	ports, err := utils.FindAvailablePorts(portCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "no_free_ports"})
		return
	}

	internalPorts := make([]int, len(challenge.Ports))
	for i, p := range challenge.Ports {
		internalPorts[i] = int(p)
	}

	// Ensure Docker connection is available before starting instance
	if err := utils.EnsureDockerClientConnected(); err != nil {
		debug.Log("Docker connection failed when starting instance for challenge %s: %v", challenge.Slug, err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "docker_unavailable",
			"message": "Docker service is currently unavailable. Please try again later or contact an administrator.",
		})
		return
	}

	containerID, err := utils.StartDockerInstance(imageName, int(*user.TeamID), int(user.ID), internalPorts, ports)
	if err != nil {
		log.Printf("DEBUG: Error starting Docker instance: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate expiration time
	var expiresAt time.Time
	if dockerConfig.InstanceTimeout > 0 {
		expiresAt = time.Now().Add(time.Duration(dockerConfig.InstanceTimeout) * time.Minute)
	} else {
		expiresAt = time.Now().Add(24 * time.Hour) // Default 24 hours if no timeout set
	}

	// Convert ports to pq.Int64Array for storage
	ports64 := make(pq.Int64Array, len(ports))
	for i, p := range ports {
		ports64[i] = int64(p)
	}

	instance := models.Instance{
		Container:   containerID,
		UserID:      user.ID,
		TeamID:      *user.TeamID,
		ChallengeID: challenge.ID,
		Ports:       ports64, // Store the dynamically assigned ports
		CreatedAt:   time.Now(),
		ExpiresAt:   expiresAt,
		Status:      "running",
	}
	if err := config.DB.Create(&instance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "instance_create_failed"})
		return
	}

	// Broadcast instance start event to the whole team (except the starter)
	if WebSocketHub != nil {
		// Build connection info similar to GetInstanceStatus
		var connectionInfo []string
		if len(challenge.ConnectionInfo) > 0 {
			ip := os.Getenv("PTA_PUBLIC_IP")
			if ip == "" {
				ip = "worker-ip"
			}

			for i, info := range challenge.ConnectionInfo {
				formattedInfo := strings.ReplaceAll(info, "$ip", ip)
				if i < len(ports) {
					for j, originalPort := range challenge.Ports {
						if j < len(ports) {
							originalPortStr := fmt.Sprintf(":%d", originalPort)
							newPortStr := fmt.Sprintf(":%d", ports[j])
							formattedInfo = strings.ReplaceAll(formattedInfo, originalPortStr, newPortStr)
						}
					}
				}
				connectionInfo = append(connectionInfo, formattedInfo)
			}
		}

		type InstanceEvent struct {
			Event          string    `json:"event"`
			TeamID         uint      `json:"teamId"`
			UserID         uint      `json:"userId"`
			Username       string    `json:"username"`
			ChallengeID    uint      `json:"challengeId"`
			Status         string    `json:"status"`
			CreatedAt      time.Time `json:"createdAt"`
			ExpiresAt      time.Time `json:"expiresAt"`
			Container      string    `json:"container"`
			Ports          []int     `json:"ports"`
			ConnectionInfo []string  `json:"connectionInfo"`
		}

		event := InstanceEvent{
			Event:          "instance_update",
			TeamID:         user.Team.ID,
			UserID:         user.ID,
			Username:       user.Username,
			ChallengeID:    challenge.ID,
			Status:         "running",
			CreatedAt:      instance.CreatedAt,
			ExpiresAt:      instance.ExpiresAt,
			Container:      instance.Container,
			Ports:          ports,
			ConnectionInfo: connectionInfo,
		}
		if payload, err := json.Marshal(event); err == nil {
			WebSocketHub.SendToTeamExcept(user.Team.ID, user.ID, payload)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":         "instance_started",
		"image_name":     imageName,
		"container_name": containerID,
		"expires_at":     expiresAt,
		"ports":          ports,
	})
}

func KillChallengeInstance(c *gin.Context) {
	challengeID := c.Param("id")
	userID, ok := c.Get("user_id")
	if !ok {
		log.Printf("DEBUG: No user_id in context for kill request")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	log.Printf("DEBUG: Killing instance for challenge ID: %s by user ID: %v", challengeID, userID)

	var user models.User
	if err := config.DB.Preload("Team").First(&user, userID).Error; err != nil {
		log.Printf("DEBUG: User not found with ID %v: %v", userID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}
	log.Printf("DEBUG: Found user: %s, TeamID: %v", user.Username, user.TeamID)

	if user.Team == nil || user.TeamID == nil {
		log.Printf("DEBUG: User has no team: Team=%v, TeamID=%v", user.Team, user.TeamID)
		c.JSON(http.StatusForbidden, gin.H{"error": "team_required"})
		return
	}
	log.Printf("DEBUG: User team: %s (ID: %d)", user.Team.Name, user.Team.ID)

	// Find the instance for this user/team and challenge
	var instance models.Instance
	if err := config.DB.Where("team_id = ? AND challenge_id = ?", user.Team.ID, challengeID).First(&instance).Error; err != nil {
		log.Printf("DEBUG: Instance not found for team %d, challenge %s: %v", user.Team.ID, challengeID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "instance_not_found"})
		return
	}
	log.Printf("DEBUG: Found instance: ID=%d, Container=%s, Status=%s", instance.ID, instance.Container, instance.Status)

	// Check if user owns this instance or is admin
	if instance.UserID != user.ID && user.Role != "admin" {
		log.Printf("DEBUG: User %d not authorized to kill instance owned by user %d (user role: %s)", user.ID, instance.UserID, user.Role)
		c.JSON(http.StatusForbidden, gin.H{"error": "not_authorized"})
		return
	}
	log.Printf("DEBUG: User authorized to kill instance")

	// Stop the Docker container
	log.Printf("DEBUG: Stopping Docker container: %s", instance.Container)
	if err := utils.StopDockerInstance(instance.Container); err != nil {
		log.Printf("DEBUG: Error stopping Docker instance: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_stop_instance"})
		return
	}
	log.Printf("DEBUG: Docker container stopped successfully: %s", instance.Container)

	// Update instance status
	log.Printf("DEBUG: Updating instance status to 'stopped'")
	instance.Status = "stopped"
	if err := config.DB.Save(&instance).Error; err != nil {
		log.Printf("DEBUG: Error updating instance status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_instance"})
		return
	}
	log.Printf("DEBUG: Instance status updated successfully")

	// Record cooldown immediately before kill to prevent rapid restarts
	if instance.TeamID != 0 {
		now := time.Now().UTC()
		var cd models.InstanceCooldown
		if err := config.DB.Where("team_id = ? AND challenge_id = ?", instance.TeamID, instance.ChallengeID).First(&cd).Error; err == nil {
			cd.LastStoppedAt = now
			_ = config.DB.Save(&cd).Error
		} else {
			_ = config.DB.Create(&models.InstanceCooldown{TeamID: instance.TeamID, ChallengeID: instance.ChallengeID, LastStoppedAt: now}).Error
		}
	}

	// Broadcast instance stopped event to team (except the actor)
	if WebSocketHub != nil {
		type InstanceEvent struct {
			Event       string    `json:"event"`
			TeamID      uint      `json:"teamId"`
			UserID      uint      `json:"userId"`
			Username    string    `json:"username"`
			ChallengeID uint      `json:"challengeId"`
			Status      string    `json:"status"`
			UpdatedAt   time.Time `json:"updatedAt"`
		}
		event := InstanceEvent{
			Event:       "instance_update",
			TeamID:      user.Team.ID,
			UserID:      user.ID,
			Username:    user.Username,
			ChallengeID: instance.ChallengeID,
			Status:      "stopped",
			UpdatedAt:   time.Now().UTC(),
		}
		if payload, err := json.Marshal(event); err == nil {
			WebSocketHub.SendToTeamExcept(user.Team.ID, user.ID, payload)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "instance_stopped",
		"message": "Instance stopped successfully",
	})
	log.Printf("DEBUG: Kill instance request completed successfully for challenge %s", challengeID)
}

func GetInstanceStatus(c *gin.Context) {
	challengeID := c.Param("id")
	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var user models.User
	if err := config.DB.Preload("Team").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}

	if user.Team == nil || user.TeamID == nil {
		c.JSON(http.StatusOK, gin.H{
			"has_instance": false,
			"status":       "no_team",
		})
		return
	}

	// Find the instance for this user/team and challenge
	var instance models.Instance
	if err := config.DB.Where("team_id = ? AND challenge_id = ?", user.Team.ID, challengeID).First(&instance).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// This is expected when no instance exists - don't log as error
			c.JSON(http.StatusOK, gin.H{
				"has_instance": false,
				"status":       "no_instance",
			})
			return
		}
		// Log unexpected database errors
		debug.Log("Database error when checking instance status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database_error"})
		return
	}

	// Check if instance is expired
	isExpired := time.Now().After(instance.ExpiresAt)
	if isExpired && instance.Status == "running" {
		instance.Status = "expired"
		config.DB.Save(&instance)
	}

	// Get challenge details for connection info
	var challenge models.Challenge
	if err := config.DB.First(&challenge, challengeID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "challenge_not_found"})
		return
	}

	// Build connection info with actual ports
	var connectionInfo []string
	if instance.Status == "running" && len(challenge.ConnectionInfo) > 0 {
		// Get the IP address from environment or use a placeholder
		ip := os.Getenv("PTA_PUBLIC_IP")
		if ip == "" {
			ip = "your-instance-ip" // Fallback placeholder
		}

		// Convert instance ports to int slice for easier handling
		instancePorts := make([]int, len(instance.Ports))
		for i, p := range instance.Ports {
			instancePorts[i] = int(p)
		}

		for i, info := range challenge.ConnectionInfo {
			// Replace $ip placeholder with actual IP
			formattedInfo := strings.ReplaceAll(info, "$ip", ip)

			// If we have a corresponding port in the instance, replace the port number
			if i < len(instancePorts) {
				// Find the original port number in the connection info and replace it
				// This is a simple approach - for more complex cases, we might need regex
				for j, originalPort := range challenge.Ports {
					if j < len(instancePorts) {
						originalPortStr := fmt.Sprintf(":%d", originalPort)
						newPortStr := fmt.Sprintf(":%d", instancePorts[j])
						formattedInfo = strings.ReplaceAll(formattedInfo, originalPortStr, newPortStr)
					}
				}
			}

			connectionInfo = append(connectionInfo, formattedInfo)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"has_instance":    true,
		"status":          instance.Status,
		"created_at":      instance.CreatedAt,
		"expires_at":      instance.ExpiresAt,
		"is_expired":      isExpired,
		"container":       instance.Container,
		"ports":           instance.Ports,
		"connection_info": connectionInfo,
	})
}

func StopChallengeInstance(c *gin.Context) {
	challengeID := c.Param("id")
	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var user models.User
	if err := config.DB.Select("id, team_id").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}

	var instance models.Instance
	// Scope by team to be consistent with start and kill handlers
	query := config.DB.Where("challenge_id = ? AND team_id = ?", challengeID, func() uint {
		if user.TeamID != nil {
			return *user.TeamID
		}
		return 0
	}())
	if err := query.First(&instance).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance_not_found"})
		return
	}

	if instance.UserID != user.ID && (user.TeamID == nil || instance.TeamID != *user.TeamID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	// Record cooldown immediately to prevent race conditions with immediate restarts
	if instance.TeamID != 0 {
		now := time.Now().UTC()
		var cd models.InstanceCooldown
		if err := config.DB.Where("team_id = ? AND challenge_id = ?", instance.TeamID, instance.ChallengeID).First(&cd).Error; err == nil {
			cd.LastStoppedAt = now
			_ = config.DB.Save(&cd).Error
		} else {
			_ = config.DB.Create(&models.InstanceCooldown{TeamID: instance.TeamID, ChallengeID: instance.ChallengeID, LastStoppedAt: now}).Error
		}
	}

	go func() {
		if err := utils.StopDockerInstance(instance.Container); err != nil {
			log.Printf("Failed to stop Docker instance: %v", err)
		}

		if err := config.DB.Delete(&instance).Error; err != nil {
			log.Printf("Failed to delete instance from database: %v", err)
		}

		// Cooldown already recorded synchronously above
	}()

	// Broadcast instance stopped event to team (except the actor)
	if WebSocketHub != nil {
		// Retrieve basic user for username if available
		var user models.User
		if err := config.DB.Select("id, username, team_id").First(&user, userID).Error; err == nil && user.TeamID != nil {
			type InstanceEvent struct {
				Event       string    `json:"event"`
				TeamID      uint      `json:"teamId"`
				UserID      uint      `json:"userId"`
				Username    string    `json:"username"`
				ChallengeID uint      `json:"challengeId"`
				Status      string    `json:"status"`
				UpdatedAt   time.Time `json:"updatedAt"`
			}
			event := InstanceEvent{
				Event:       "instance_update",
				TeamID:      *user.TeamID,
				UserID:      user.ID,
				Username:    user.Username,
				ChallengeID: instance.ChallengeID,
				Status:      "stopped",
				UpdatedAt:   time.Now().UTC(),
			}
			if payload, err := json.Marshal(event); err == nil {
				WebSocketHub.SendToTeamExcept(*user.TeamID, user.ID, payload)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "instance_stopping",
		"container": instance.Container,
	})
}
