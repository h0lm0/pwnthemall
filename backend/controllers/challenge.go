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
)

func GetChallenges(c *gin.Context) {
	var challenges []models.Challenge
	result := config.DB.Find(&challenges)
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

	// If CTF hasn't started and user isn't admin, return empty list
	if !config.IsCTFStarted() && user.Role != "admin" {
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	var challenges []models.Challenge
	result := config.DB.
		Preload("ChallengeCategory").
		Preload("ChallengeType").
		Preload("ChallengeDifficulty").
		Preload("DecayFormula").
		Preload("Hints").
		Joins("JOIN challenge_categories ON challenge_categories.id = challenges.challenge_category_id").
		Where("challenge_categories.name = ?", categoryName).
		Find(&challenges)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	// Get stid challenges for the user's team
	var solvedChallengeIds []uint
	if user.Team != nil {
		var solves []models.Solve
		if err := config.DB.Where("team_id = ?", user.Team.ID).Find(&solves).Error; err == nil {
			for _, solve := range solves {
				solvedChallengeIds = append(solvedChallengeIds, solve.ChallengeID)
			}
		}
	}

	// Initialize decay service
	decayService := utils.NewDecay()

	// Create response with solved status and current points
	type ChallengeWithSolved struct {
		models.Challenge
		Solved        bool `json:"solved"`
		CurrentPoints int  `json:"currentPoints"`
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

		// Calculate current points based on decay formula
		var solveCount int64
		config.DB.Model(&models.Solve{}).Where("challenge_id = ?", challenge.ID).Count(&solveCount)

		currentPoints := decayService.CalculateDecayedPoints(&challenge, int(solveCount))

		challengeWithSolved := ChallengeWithSolved{
			Challenge:     challenge,
			Solved:        solved,
			CurrentPoints: currentPoints,
		}
		challengesWithSolved = append(challengesWithSolved, challengeWithSolved)
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

func SubmitChallenge(c *gin.Context) {
	var challenge models.Challenge

	challengeId := c.Param("id")
	if err := config.DB.Preload("Flags").Where("id = ?", challengeId).First(&challenge).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
		return
	}

	var input FlagInput
	if err := c.ShouldBindJSON(&input); err != nil {
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

	// Enforce CTF timing: block submission before start or after end
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

	var submission models.Submission
	if err := config.DB.FirstOrCreate(&submission, models.Submission{Value: input.Flag, UserID: user.ID, ChallengeID: challenge.ID}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "submission_create_failed"})
	}

	found := false
	for _, flag := range challenge.Flags {
		if flag.Value == utils.HashFlag(input.Flag) {
			found = true
			break
		}
	}
	if found {
		// Calculate decayed points
		decayService := utils.NewDecay()
		var solveCount int64
		config.DB.Model(&models.Solve{}).Where("challenge_id = ?", challenge.ID).Count(&solveCount)
		decayedPoints := decayService.CalculateDecayedPoints(&challenge, int(solveCount))

		// Create the solve record directly
		solve := models.Solve{
			TeamID:      user.Team.ID,
			ChallengeID: challenge.ID,
			UserID:      user.ID,
			Points:      decayedPoints,
			SolvedBy:    user.Username,
		}

		if err := config.DB.Create(&solve).Error; err != nil {
			log.Printf("Failed to create solve: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "solve_create_failed"})
			return
		}

		// Broadcast team solve event
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
			Points:        decayedPoints,
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
				if instance.Container != "" {
					if err := utils.StopDockerInstance(instance.Container); err != nil {
						log.Printf("Failed to stop Docker instance on solve: %v", err)
					}
				}
				if err := config.DB.Delete(&instance).Error; err != nil {
					log.Printf("Failed to delete instance on solve: %v", err)
				}
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

		// After a successful solve, award first blood badge if applicable
		CheckAndAwardFirstBlood(user.ID, challenge.ID)

		// Check and create FirstBlood if this solve qualifies for a position bonus
		if challenge.EnableFirstBlood && len(challenge.FirstBloodBonuses) > 0 {
			// La position est solveCount (0-based), donc 0 = 1er, 1 = 2ème, etc.
			position := int(solveCount)
			// Pour l'instant, on utilise le même bonus pour toutes les positions
			// Plus tard, on pourra étendre pour avoir un array de bonus différents
			bonuses := challenge.FirstBloodBonuses
			if position < len(bonuses) {
				// Convert int64 to int for the bonus value
				bonusValue := int(bonuses[position])
				firstBlood := models.FirstBlood{
					ChallengeID: challenge.ID,
					TeamID:      user.Team.ID,
					UserID:      user.ID,
					Bonuses:     []int{bonusValue},
					Badges:      []string{fmt.Sprintf("position-%d", position+1)},
				}
				if err := config.DB.Create(&firstBlood).Error; err != nil {
					log.Printf("Failed to create first blood: %v", err)
				}
			}
		}

		// Also award badge if configured
		CheckAndAwardFirstBlood(user.ID, challenge.ID)

		c.JSON(http.StatusOK, gin.H{"message": "challenge_solved", "points": decayedPoints})
		return
	} else {
		c.JSON(http.StatusForbidden, gin.H{"result": "wrong_flag"})
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
	if challenge.ChallengeType.Name != "docker" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "challenge_not_docker_type"})
		return
	}

	imageName, exists := utils.IsImageBuilt(challenge.Slug)
	if !exists {
		if err := utils.EnsureDockerClientConnected(); err != nil {
			debug.Log("Docker connection failed for challenge %s: %v", challenge.Slug, err)
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "docker_unavailable", "message": "Docker service is currently unavailable."})
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

	var countExist int64
	config.DB.Model(&models.Instance{}).Where("team_id = ? AND challenge_id = ?", user.Team.ID, challenge.ID).Count(&countExist)
	if int(countExist) >= 1 {
		c.JSON(http.StatusForbidden, gin.H{"error": "instance_already_running"})
		return
	}
	var countUser int64
	config.DB.Model(&models.Instance{}).Where("user_id = ?", user.ID).Count(&countUser)
	if int(countUser) >= dockerConfig.InstancesByUser {
		c.JSON(http.StatusForbidden, gin.H{"error": "max_instances_by_user_reached"})
		return
	}
	var countTeam int64
	config.DB.Model(&models.Instance{}).Where("team_id = ?", user.Team.ID).Count(&countTeam)
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

	if err := utils.EnsureDockerClientConnected(); err != nil {
		debug.Log("Docker connection failed when starting instance for challenge %s: %v", challenge.Slug, err)
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "docker_unavailable", "message": "Docker service is currently unavailable."})
		return
	}

	containerID, err := utils.StartDockerInstance(imageName, int(*user.TeamID), int(user.ID), internalPorts, ports)
	if err != nil {
		log.Printf("DEBUG: Error starting Docker instance: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var expiresAt time.Time
	if dockerConfig.InstanceTimeout > 0 {
		expiresAt = time.Now().Add(time.Duration(dockerConfig.InstanceTimeout) * time.Minute)
	} else {
		expiresAt = time.Now().Add(24 * time.Hour)
	}

	ports64 := make(pq.Int64Array, len(ports))
	for i, p := range ports {
		ports64[i] = int64(p)
	}

	instance := models.Instance{
		Container:   containerID,
		UserID:      user.ID,
		TeamID:      *user.TeamID,
		ChallengeID: challenge.ID,
		Ports:       ports64,
		CreatedAt:   time.Now(),
		ExpiresAt:   expiresAt,
		Status:      "running",
	}
	if err := config.DB.Create(&instance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "instance_create_failed"})
		return
	}

	if WebSocketHub != nil {
		var connectionInfo []string
		if len(challenge.ConnectionInfo) > 0 {
			ip := os.Getenv("PTA_PUBLIC_IP")
			if ip == "" {
				ip = "worker-ip"
			}
			for i, info := range challenge.ConnectionInfo {
				formatted := strings.ReplaceAll(info, "$ip", ip)
				if i < len(ports) {
					for j, originalPort := range challenge.Ports {
						if j < len(ports) {
							originalPortStr := fmt.Sprintf(":%d", originalPort)
							newPortStr := fmt.Sprintf(":%d", ports[j])
							formatted = strings.ReplaceAll(formatted, originalPortStr, newPortStr)
						}
					}
				}
				connectionInfo = append(connectionInfo, formatted)
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
	if err := config.DB.Where("team_id = ? AND challenge_id = ?", *user.TeamID, challengeID).First(&instance).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance_not_found"})
		return
	}

	if instance.UserID != user.ID && (user.TeamID == nil || instance.TeamID != *user.TeamID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	if instance.UserID != user.ID && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "not_authorized"})
		return
	}

	if err := utils.StopDockerInstance(instance.Container); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_stop_instance"})
		return
	}

	instance.Status = "stopped"
	if err := config.DB.Save(&instance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_instance"})
		return
	}

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

	c.JSON(http.StatusOK, gin.H{"status": "instance_stopped", "message": "Instance stopped successfully"})
}

func KillChallengeInstance(c *gin.Context) {
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
		c.JSON(http.StatusForbidden, gin.H{"error": "team_required"})
		return
	}

	var instance models.Instance
	if err := config.DB.Where("team_id = ? AND challenge_id = ?", user.Team.ID, challengeID).First(&instance).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance_not_found"})
		return
	}

	if instance.UserID != user.ID && user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "not_authorized"})
		return
	}

	if err := utils.StopDockerInstance(instance.Container); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_stop_instance"})
		return
	}

	instance.Status = "stopped"
	if err := config.DB.Save(&instance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_update_instance"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "instance_stopped",
		"message": "Instance stopped successfully",
	})
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
	if user.TeamID == nil || user.Team == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "team_required"})
		return
	}

	var instance models.Instance
	if err := config.DB.Where("team_id = ? AND challenge_id = ?", user.Team.ID, challengeID).First(&instance).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"has_instance": false})
		return
	}

	var dockerConfig models.DockerConfig
	if err := config.DB.First(&dockerConfig).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "docker_config_not_found"})
		return
	}

	expiresAt := instance.CreatedAt.Add(time.Duration(dockerConfig.InstanceTimeout) * time.Minute)
	isExpired := time.Now().After(expiresAt)

	c.JSON(http.StatusOK, gin.H{
		"has_instance": true,
		"status":       instance.Status,
		"created_at":   instance.CreatedAt,
		"expires_at":   expiresAt,
		"is_expired":   isExpired,
		"container":    instance.Container,
	})
}
