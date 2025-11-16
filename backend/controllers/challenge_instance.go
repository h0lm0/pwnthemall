package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"pwnthemall/config"
	"pwnthemall/debug"
	"pwnthemall/dto"
	"pwnthemall/models"
	"pwnthemall/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// BuildChallengeImage builds a Docker image for a challenge
func BuildChallengeImage(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")
	result := config.DB.Preload("ChallengeType").First(&challenge, id)
	if result.Error != nil {
		utils.NotFoundError(c, "challenge_not_found")
		return
	}
	// Check if challenge is of type docker
	if challenge.ChallengeType.Name != "docker" {
		utils.BadRequestError(c, "challenge_not_docker_type")
		return
	}

	// Download the challenge context to a temporary directory
	tmpDir := filepath.Join(os.TempDir(), challenge.Slug)
	defer os.RemoveAll(tmpDir)

	if err := utils.DownloadChallengeContext(challenge.Slug, tmpDir); err != nil {
		utils.InternalServerError(c, fmt.Sprintf("Failed to download challenge context: %v", err))
		return
	}

	// Build the Docker image using the temporary directory as the source
	_, err := utils.BuildDockerImage(challenge.Slug, tmpDir)
	if err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.OKResponse(c, gin.H{"message": fmt.Sprintf("Successfully built image for challenge %s", challenge.Slug)})
}

// StartChallengeInstance starts a Docker instance for a challenge
func StartChallengeInstance(c *gin.Context) {
	id := c.Param("id")
	var challenge models.Challenge
	result := config.DB.Preload("ChallengeType").First(&challenge, id)

	if result.Error != nil {
		debug.Log("Challenge not found with ID %s: %v", id, result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
		return
	}

	switch challenge.ChallengeType.Name {
	case "docker":
		StartDockerChallengeInstance(c)
	case "compose":
		StartComposeChallengeInstance(c)
	}
}

// KillChallengeInstance forcefully stops a challenge instance
func KillChallengeInstance(c *gin.Context) {
	challengeID := c.Param("id")
	userID, ok := c.Get("user_id")
	if !ok {
		debug.Log("No user_id in context for kill request")
		utils.UnauthorizedError(c, "unauthorized")
		return
	}
	debug.Log("Killing instance for challenge ID: %s by user ID: %v", challengeID, userID)

	var user models.User
	if err := config.DB.Preload("Team").First(&user, userID).Error; err != nil {
		debug.Log("User not found with ID %v: %v", userID, err)
		utils.NotFoundError(c, "user_not_found")
		return
	}
	debug.Log("Found user: %s, TeamID: %v", user.Username, user.TeamID)

	if user.Team == nil || user.TeamID == nil {
		debug.Log("User has no team: Team=%v, TeamID=%v", user.Team, user.TeamID)
		utils.ForbiddenError(c, "team_required")
		return
	}
	debug.Log("User team: %s (ID: %d)", user.Team.Name, user.Team.ID)

	// Find the instance for this user/team and challenge
	var instance models.Instance
	if err := config.DB.Where("team_id = ? AND challenge_id = ?", user.Team.ID, challengeID).First(&instance).Error; err != nil {
		debug.Log("Instance not found for team %d, challenge %s: %v", user.Team.ID, challengeID, err)
		utils.NotFoundError(c, "instance_not_found")
		return
	}
	debug.Log("Found instance: ID=%d, Container=%s, Status=%s", instance.ID, instance.Container, instance.Status)

	// Check if user owns this instance or is admin
	if instance.UserID != user.ID && user.Role != "admin" {
		debug.Log("User %d not authorized to kill instance owned by user %d (user role: %s)", user.ID, instance.UserID, user.Role)
		utils.ForbiddenError(c, "not_authorized")
		return
	}
	debug.Log("User authorized to kill instance")

	// Stop the Docker container
	debug.Log("Stopping Docker container: %s", instance.Container)
	if err := utils.StopDockerInstance(instance.Container); err != nil {
		debug.Log("Error stopping Docker instance: %v", err)
		utils.InternalServerError(c, "failed_to_stop_instance")
		return
	}
	debug.Log("Docker container stopped successfully: %s", instance.Container)

	// Update instance status
	debug.Log("Updating instance status to 'stopped'")
	instance.Status = "stopped"
	if err := config.DB.Save(&instance).Error; err != nil {
		debug.Log("Error updating instance status: %v", err)
		utils.InternalServerError(c, "failed_to_update_instance")
		return
	}
	debug.Log("Instance status updated successfully")

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
	if utils.WebSocketHub != nil {
		event := dto.InstanceEvent{
			Event:       "instance_update",
			TeamID:      user.Team.ID,
			UserID:      user.ID,
			Username:    user.Username,
			ChallengeID: instance.ChallengeID,
			Status:      "stopped",
			UpdatedAt:   time.Now().UTC().Unix(),
		}
		if payload, err := json.Marshal(event); err == nil {
			utils.WebSocketHub.SendToTeamExcept(user.Team.ID, user.ID, payload)
		}
	}

	utils.OKResponse(c, gin.H{
		"status":  "instance_stopped",
		"message": "Instance stopped successfully",
	})
	debug.Log("Kill instance request completed successfully for challenge %s", challengeID)
}

func StartDockerChallengeInstance(c *gin.Context) {
	id := c.Param("id")
	debug.Log("Starting instance for challenge ID: %s", id)
	var challenge models.Challenge
	result := config.DB.Preload("ChallengeType").First(&challenge, id)
	if result.Error != nil {
		debug.Log("Challenge not found with ID %s: %v", id, result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
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
		// Use the new BuildDockerImage function with sourceDir
		// For Docker challenges, the source directory is typically the challenge's directory
		tmpDir := filepath.Join(os.TempDir(), challenge.Slug)
		if err := utils.DownloadChallengeContext(challenge.Slug, tmpDir); err != nil {
			debug.Log("Failed to download challenge context: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_download_challenge"})
			return
		}
		defer os.RemoveAll(tmpDir)
		imageName, err = utils.BuildDockerImage(challenge.Slug, tmpDir)
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
		debug.Log("Error starting Docker instance: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Calculate expiration time
	var expiresAt time.Time
	if dockerConfig.InstanceTimeout > 0 {
		expiresAt = time.Now().Add(time.Duration(dockerConfig.InstanceTimeout) * time.Minute)
	} else {
		expiresAt = time.Now().Add(24 * time.Hour)
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
		Ports:       ports64,
		CreatedAt:   time.Now(),
		ExpiresAt:   expiresAt,
		Status:      "running",
	}

	if err := config.DB.Create(&instance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "instance_create_failed"})
		return
	}

	// Broadcast instance start event to the whole team (except the starter)
	if utils.WebSocketHub != nil {
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
			utils.WebSocketHub.SendToTeamExcept(user.Team.ID, user.ID, payload)
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

func StartComposeChallengeInstance(c *gin.Context) {
	id := c.Param("id")
	debug.Log("Starting instance for compose challenge ID: %s", id)

	var challenge models.Challenge
	result := config.DB.Preload("ChallengeType").First(&challenge, id)
	if result.Error != nil {
		debug.Log("Challenge not found with ID %s: %v", id, result.Error)
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
		return
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
		debug.Log("User not found: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}
	if user.Team == nil || user.TeamID == nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "team_required"})
		return
	}

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

	var countExist, countUser, countTeam int64
	config.DB.Model(&models.Instance{}).Where("team_id = ? AND challenge_id = ?", user.Team.ID, challenge.ID).Count(&countExist)
	config.DB.Model(&models.Instance{}).Where("user_id = ?", user.ID).Count(&countUser)
	config.DB.Model(&models.Instance{}).Where("team_id = ?", user.Team.ID).Count(&countTeam)
	if countExist > 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "instance_already_running"})
		return
	}
	if int(countUser) >= dockerConfig.InstancesByUser {
		c.JSON(http.StatusForbidden, gin.H{"error": "max_instances_by_user_reached"})
		return
	}
	if int(countTeam) >= dockerConfig.InstancesByTeam {
		c.JSON(http.StatusForbidden, gin.H{"error": "max_instances_by_team_reached"})
		return
	}

	if err := utils.EnsureDockerClientConnected(); err != nil {
		debug.Log("Docker connection failed: %v", err)
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error":   "docker_unavailable",
			"message": "Docker service unavailable.",
		})
		return
	}

	compose, err := utils.GetComposeFile(challenge.Slug)
	if err != nil {
		debug.Log("GetComposeFile failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	project, err := utils.CreateComposeProject(challenge.Slug, int(*user.TeamID), int(user.ID), compose)
	if err != nil {
		debug.Log("CreateComposeProject failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "create_compose_failed"})
		return
	}

	ports, err := utils.RandomizeServicePorts(project)
	if err != nil {
		debug.Log("RandomizeServicePorts failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "randomize_ports_failed"})
		return
	}

	if err := utils.StartComposeInstance(project, int(*user.TeamID)); err != nil {
		debug.Log("StartComposeInstance failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "start_compose_failed"})
		return
	}

	expiresAt := time.Now().Add(time.Duration(dockerConfig.InstanceTimeout) * time.Minute)
	if dockerConfig.InstanceTimeout <= 0 {
		expiresAt = time.Now().Add(24 * time.Hour)
	}

	ports64 := make(pq.Int64Array, len(ports))
	for i, p := range ports {
		ports64[i] = int64(p)
	}

	instance := models.Instance{
		UserID:      user.ID,
		TeamID:      *user.TeamID,
		ChallengeID: challenge.ID,
		Container:   project.Name,
		Ports:       ports64,
		Status:      "running",
		CreatedAt:   time.Now(),
		ExpiresAt:   expiresAt,
	}

	if err := config.DB.Create(&instance).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "instance_create_failed"})
		return
	}

	if utils.WebSocketHub != nil {
		event := map[string]interface{}{
			"event":       "instance_update",
			"teamId":      user.Team.ID,
			"userId":      user.ID,
			"username":    user.Username,
			"challengeId": challenge.ID,
			"status":      "running",
			"createdAt":   instance.CreatedAt,
			"expiresAt":   instance.ExpiresAt,
			"container":   instance.Container,
			"ports":       ports,
		}
		if payload, err := json.Marshal(event); err == nil {
			utils.WebSocketHub.SendToTeamExcept(user.Team.ID, user.ID, payload)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     "compose_instance_started",
		"project":    project.Name,
		"expires_at": expiresAt,
		"ports":      ports,
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

	var challenge models.Challenge
	if err := config.DB.Preload("ChallengeType").First(&challenge, challengeID).Error; err != nil {
		debug.Log("Challenge not found with ID %s: %v", challengeID, err)
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge_not_found"})
		return
	}

	switch challenge.ChallengeType.Name {
	case "docker":
		go func() {
			if err := utils.StopDockerInstance(instance.Container); err != nil {
				debug.Log("Failed to stop Docker instance: %v", err)
			}
			if err := config.DB.Delete(&instance).Error; err != nil {
				debug.Log("Failed to delete instance from DB: %v", err)
			}
		}()

	case "compose":
		if err := utils.StopComposeInstance(instance.Container); err != nil {
			debug.Log("Failed to stop Compose instance: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "compose_stop_failed"})
			return
		}
		if err := config.DB.Delete(&instance).Error; err != nil {
			debug.Log("Failed to delete Compose instance from DB: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "db_delete_failed"})
			return
		}

	default:
		debug.Log("Unknown challenge type: %s", challenge.ChallengeType.Name)
		c.JSON(http.StatusBadRequest, gin.H{"error": "unknown_challenge_type"})
		return
	}

	if utils.WebSocketHub != nil {
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
				utils.WebSocketHub.SendToTeamExcept(*user.TeamID, user.ID, payload)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "instance_stopped",
		"container": instance.Container,
	})
}

// GetInstanceStatus returns the status of a challenge instance for a team
func GetInstanceStatus(c *gin.Context) {
	challengeID := c.Param("id")
	userID, ok := c.Get("user_id")
	if !ok {
		utils.UnauthorizedError(c, "unauthorized")
		return
	}

	var user models.User
	if err := config.DB.Preload("Team").First(&user, userID).Error; err != nil {
		utils.NotFoundError(c, "user_not_found")
		return
	}

	if user.Team == nil || user.TeamID == nil {
		utils.OKResponse(c, gin.H{
			"has_instance": false,
			"status":       "no_team",
		})
		return
	}

	var instance models.Instance
	if err := config.DB.Where("team_id = ? AND challenge_id = ?", user.Team.ID, challengeID).First(&instance).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			utils.OKResponse(c, gin.H{
				"has_instance": false,
				"status":       "no_instance",
			})
			return
		}
		debug.Log("Database error when checking instance status: %v", err)
		utils.InternalServerError(c, "database_error")
		return
	}

	isExpired := time.Now().After(instance.ExpiresAt)
	if isExpired && instance.Status == "running" {
		instance.Status = "expired"
		config.DB.Save(&instance)
	}

	var challenge models.Challenge
	if err := config.DB.First(&challenge, challengeID).Error; err != nil {
		utils.InternalServerError(c, "challenge_not_found")
		return
	}

	// Build connection info with actual ports
	var connectionInfo []string
	if instance.Status == "running" && len(challenge.ConnectionInfo) > 0 {
		ip := os.Getenv("PTA_PUBLIC_IP")
		if ip == "" {
			ip = "instance-ip"
		}

		instancePorts := make([]int, len(instance.Ports))
		for i, p := range instance.Ports {
			instancePorts[i] = int(p)
		}

		debug.Log("Starting port mapping for challenge %v", instancePorts)

		for i, info := range challenge.ConnectionInfo {
			formattedInfo := strings.ReplaceAll(info, "$ip", ip)
			if i < len(instancePorts) {
				for j, originalPort := range challenge.Ports {
					if j < len(instancePorts) {
						originalPortStr := fmt.Sprintf("[%d]", originalPort)
						newPortStr := fmt.Sprintf("%d", instancePorts[j])
						formattedInfo = strings.ReplaceAll(formattedInfo, originalPortStr, newPortStr)
					}
				}
			}

			connectionInfo = append(connectionInfo, formattedInfo)
		}
	}

	utils.OKResponse(c, gin.H{
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
