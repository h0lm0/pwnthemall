package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

func GetDockerConfig(c *gin.Context) {
	var cfg models.DockerConfig

	result := config.DB.First(&cfg)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Docker Configuration not found"})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

func UpdateDockerConfig(c *gin.Context) {
	var newCfg models.DockerConfig

	if err := c.ShouldBindJSON(&newCfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var existingCfg models.DockerConfig
	result := config.DB.First(&existingCfg)

	if result.Error != nil {
		if err := config.DB.Create(&newCfg).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Docker Configuration"})
			return
		}
		c.JSON(http.StatusCreated, newCfg)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update Docker Configuration"})
		return
	}
	if err := config.ConnectDocker(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Config updated but connection to Docker Daemon isn't healthy"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Successfully updated Docker configuration"})
}
