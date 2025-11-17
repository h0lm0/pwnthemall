package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

func GetDockerConfig(c *gin.Context) {
	var cfg models.DockerConfig

	result := config.DB.First(&cfg)
	if result.Error != nil {
		utils.NotFoundError(c, "Docker Configuration not found")
		return
	}
	utils.OKResponse(c, cfg)
}

func UpdateDockerConfig(c *gin.Context) {
	var newCfg models.DockerConfig

	if err := c.ShouldBindJSON(&newCfg); err != nil {
		utils.BadRequestError(c, err.Error())
		return
	}

	var existingCfg models.DockerConfig
	result := config.DB.First(&existingCfg)

	if result.Error != nil {
		if err := config.DB.Create(&newCfg).Error; err != nil {
			utils.InternalServerError(c, "Failed to create Docker Configuration")
			return
		}
		utils.CreatedResponse(c, newCfg)
		return
	}

	existingCfg.Host = newCfg.Host
	existingCfg.ImagePrefix = newCfg.ImagePrefix
	existingCfg.InstancesByTeam = newCfg.InstancesByTeam
	existingCfg.InstancesByUser = newCfg.InstancesByUser
	existingCfg.MaxMemByInstance = newCfg.MaxMemByInstance
	existingCfg.MaxCpuByInstance = newCfg.MaxCpuByInstance
	existingCfg.InstanceTimeout = newCfg.InstanceTimeout
	existingCfg.InstanceCooldownSeconds = newCfg.InstanceCooldownSeconds

	if err := config.DB.Save(&existingCfg).Error; err != nil {
		utils.InternalServerError(c, "Failed to update Docker Configuration")
		return
	}
	if err := config.ConnectDocker(); err != nil {
		utils.InternalServerError(c, "Config updated but connection to Docker Daemon isn't healthy")
		return
	}
	utils.OKResponse(c, gin.H{"message": "Successfully updated Docker configuration"})
}
