package controllers

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"pwnthemall/config"
	"pwnthemall/models"
	"pwnthemall/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
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

	var challenges []models.Challenge
	result := config.DB.
		Preload("ChallengeCategory").
		Preload("ChallengeType").
		Preload("ChallengeDifficulty").
		Joins("JOIN challenge_categories ON challenge_categories.id = challenges.challenge_category_id").
		Where("challenge_categories.name = ?", categoryName).
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
		Solved bool `json:"solved"`
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
		challengesWithSolved = append(challengesWithSolved, ChallengeWithSolved{
			Challenge: challenge,
			Solved:    solved,
		})
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
		var solve models.Solve
		if err := config.DB.FirstOrCreate(&solve,
			models.Solve{
				TeamID:      user.Team.ID,
				ChallengeID: challenge.ID,
				Points:      challenge.Points,
			}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "solve_create_failed"})
			return
		} else {
			c.JSON(http.StatusOK, gin.H{"message": "challenge_solved"})
			return
		}
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

	result := config.DB.First(&challenge, id).Where("type = ?", models.ChallengeType{Name: "docker"})
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
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

	var challengeType models.ChallengeType
	if err := config.DB.Where("name = ?", "docker").First(&challengeType).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_type_not_found"})
		return
	}

	var challenge models.Challenge
	result := config.DB.
		Where("challenge_type_id = ? AND id = ?", challengeType.ID, id).
		First(&challenge)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
		return
	}

	imageName, exists := utils.IsImageBuilt(challenge.Slug)
	if !exists {
		var err error
		imageName, err = utils.BuildDockerImage(challenge.Slug)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "docker_build_failed"})
			log.Printf("Docker build failed for challenge %s: %v", challenge.Slug, err)
			return
		}
	}

	userID, ok := c.Get("user_id")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var dockerConfig models.DockerConfig
	if err := config.DB.First(&dockerConfig).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "docker_config_not_found"})
		return
	}

	var user models.User
	if err := config.DB.Preload("Team").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}
	if user.Team == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "team_required"})
		return
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

	containerID, err := utils.StartDockerInstance(imageName, int(*user.TeamID), int(user.ID), internalPorts, ports)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		log.Printf(
			"Error starting instance: user: %d | team: %d | challenge: %s | error: %v",
			user.ID, *user.TeamID, challenge.Slug, err,
		)
		return
	}

	instance := models.Instance{
		Container:   containerID,
		UserID:      user.ID,
		TeamID:      *user.TeamID,
		ChallengeID: challenge.ID,
		Ports:       challenge.Ports, // enregistre les ports assignés
		CreatedAt:   time.Now(),
	}
	if err := config.DB.Create(&instance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "instance_create_failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":       "instance_started",
		"image_name":   imageName,
		"container_id": containerID,
		"ports":        ports,
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
	query := config.DB.Where("challenge_id = ? AND user_id = ?", challengeID, user.ID)
	if err := query.First(&instance).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "instance_not_found"})
		return
	}

	if instance.UserID != user.ID && (user.TeamID == nil || instance.TeamID != *user.TeamID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "forbidden"})
		return
	}

	go func() {
		if err := utils.StopDockerInstance(instance.Container); err != nil {
			log.Printf("Failed to stop Docker instance: %v", err)
		}

		if err := config.DB.Delete(&instance).Error; err != nil {
			log.Printf("Failed to delete instance from database: %v", err)
		}
	}()

	c.JSON(http.StatusOK, gin.H{
		"message":   "instance_stopping",
		"container": instance.Container,
	})
}
