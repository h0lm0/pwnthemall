package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

type ConfigInput struct {
	Key         string `json:"key" binding:"required"`
	Value       string `json:"value" binding:"required"`
	Public      bool   `json:"public"`
	SyncWithEnv bool   `json:"syncWithEnv"`
}

func GetConfigs(c *gin.Context) {
	var configs []models.Config
	result := config.DB.Find(&configs)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}

func GetConfig(c *gin.Context) {
	var cfg models.Config
	key := c.Param("key")

	result := config.DB.Where("key = ?", key).First(&cfg)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Configuration not found"})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

func CreateConfig(c *gin.Context) {
	var input ConfigInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	cfg := models.Config{
		Key:         input.Key,
		Value:       input.Value,
		Public:      input.Public,
		SyncWithEnv: input.SyncWithEnv,
	}

	if err := config.DB.Create(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Sync environment variables if this is a SyncWithEnv config
	if cfg.SyncWithEnv {
		config.SynchronizeEnvWithDb()
	}

	c.JSON(http.StatusCreated, cfg)
}

func UpdateConfig(c *gin.Context) {
	var input ConfigInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	key := c.Param("key")
	var cfg models.Config

	result := config.DB.Where("key = ?", key).First(&cfg)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Configuration not found"})
		return
	}

	cfg.Value = input.Value
	cfg.Public = input.Public
	cfg.SyncWithEnv = input.SyncWithEnv

	if err := config.DB.Save(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Sync environment variables if this is a SyncWithEnv config
	if cfg.SyncWithEnv {
		config.SynchronizeEnvWithDb()
	}

	c.JSON(http.StatusOK, cfg)
}

func DeleteConfig(c *gin.Context) {
	key := c.Param("key")
	var cfg models.Config

	result := config.DB.Where("key = ?", key).First(&cfg)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Configuration not found"})
		return
	}

	if err := config.DB.Delete(&cfg).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Sync environment variables if this was a SyncWithEnv config
	if cfg.SyncWithEnv {
		config.SynchronizeEnvWithDb()
	}

	c.JSON(http.StatusOK, gin.H{"message": "Configuration deleted successfully"})
}

// GetCTFStatus returns the current CTF timing status
func GetCTFStatus(c *gin.Context) {
	status := config.GetCTFStatus()
	c.JSON(http.StatusOK, gin.H{
		"status":     string(status),
		"is_active":  config.IsCTFActive(),
		"is_started": config.IsCTFStarted(),
	})
}

// GetPublicConfigs returns only public configurations
func GetPublicConfigs(c *gin.Context) {
	var configs []models.Config
	result := config.DB.Where("public = ?", true).Find(&configs)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}
