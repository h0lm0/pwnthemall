package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/dto"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

func GetInstances(c *gin.Context) {
	var instances []models.Instance
	result := config.DB.Preload("User").Preload("Team").Preload("Challenge").Find(&instances)
	if result.Error != nil {
		utils.InternalServerError(c, result.Error.Error())
		return
	}

	var instanceDTOs []dto.InstanceDTO
	for _, instance := range instances {
		var instanceDTO dto.InstanceDTO
		copier.Copy(&instanceDTO, &instance)
		instanceDTOs = append(instanceDTOs, instanceDTO)
	}

	utils.OKResponse(c, instanceDTOs)
}

func GetInstance(c *gin.Context) {
	var instance models.Instance
	id := c.Param("id")
	result := config.DB.Preload("User").Preload("Team").Preload("Challenge").First(&instance, id)
	if result.Error != nil {
		utils.NotFoundError(c, "Instance not found")
		return
	}

	var instanceDTO dto.InstanceDTO
	copier.Copy(&instanceDTO, &instance)

	utils.OKResponse(c, instanceDTO)
}

// GetAllInstancesAdmin returns all instances with full details for admin dashboard
func GetAllInstancesAdmin(c *gin.Context) {
	var instances []models.Instance
	result := config.DB.
		Preload("User").
		Preload("Team").
		Preload("Challenge").
		Preload("Challenge.ChallengeCategory").
		Order("created_at DESC").
		Find(&instances)

	if result.Error != nil {
		utils.InternalServerError(c, result.Error.Error())
		return
	}

	type AdminInstanceDTO struct {
		ID            uint   `json:"id"`
		Container     string `json:"container"`
		UserID        uint   `json:"userId"`
		Username      string `json:"username"`
		TeamID        uint   `json:"teamId"`
		TeamName      string `json:"teamName"`
		ChallengeID   uint   `json:"challengeId"`
		ChallengeName string `json:"challengeName"`
		Category      string `json:"category"`
		Status        string `json:"status"`
		CreatedAt     string `json:"createdAt"`
		ExpiresAt     string `json:"expiresAt"`
	}

	var instanceDTOs []AdminInstanceDTO
	for _, instance := range instances {
		dto := AdminInstanceDTO{
			ID:            instance.ID,
			Container:     instance.Container,
			UserID:        instance.UserID,
			Status:        instance.Status,
			CreatedAt:     instance.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			ExpiresAt:     instance.ExpiresAt.Format("2006-01-02T15:04:05Z07:00"),
		}

		// User is loaded via Preload
		dto.Username = instance.User.Username

		// Team is loaded via Preload
		dto.TeamID = instance.Team.ID
		dto.TeamName = instance.Team.Name

		// Challenge is loaded via Preload
		dto.ChallengeID = instance.Challenge.ID
		dto.ChallengeName = instance.Challenge.Name
		
		// ChallengeCategory is loaded via nested Preload
		if instance.Challenge.ChallengeCategory != nil {
			dto.Category = instance.Challenge.ChallengeCategory.Name
		}

		instanceDTOs = append(instanceDTOs, dto)
	}

	utils.OKResponse(c, instanceDTOs)
}

// DeleteInstanceAdmin allows admins to stop/delete any instance
func DeleteInstanceAdmin(c *gin.Context) {
	id := c.Param("id")
	var instance models.Instance
	
	result := config.DB.First(&instance, id)
	if result.Error != nil {
		utils.NotFoundError(c, "Instance not found")
		return
	}

	// Delete the instance
	if err := config.DB.Delete(&instance).Error; err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.OKResponse(c, gin.H{"message": "Instance deleted successfully"})
}
