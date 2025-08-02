package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/dto"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
)

// GetInstances - REMOVED: Public access not needed for security reasons

// GetUserInstances - For authenticated users (shows their own instances)
func GetUserInstances(c *gin.Context) {
	// Get current user from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var instances []models.Instance
	// Only show instances belonging to the authenticated user
	result := config.DB.Where("user_id = ?", userID).Find(&instances)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	var instanceDTOs []dto.UserInstanceDTO
	for _, instance := range instances {
		var instanceDTO dto.UserInstanceDTO
		copier.Copy(&instanceDTO, &instance)
		instanceDTOs = append(instanceDTOs, instanceDTO)
	}

	c.JSON(http.StatusOK, instanceDTOs)
}

// GetAdminInstances - Admin only (full data with relationships)
func GetAdminInstances(c *gin.Context) {
	// Check if user is admin
	userRole, exists := c.Get("userRole")
	if !exists || userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var instances []models.Instance
	result := config.DB.Preload("User").Preload("Team").Preload("Challenge").Find(&instances)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	var instanceDTOs []dto.AdminInstanceDTO
	for _, instance := range instances {
		var instanceDTO dto.AdminInstanceDTO
		copier.Copy(&instanceDTO, &instance)
		instanceDTOs = append(instanceDTOs, instanceDTO)
	}

	c.JSON(http.StatusOK, instanceDTOs)
}

// GetInstance - REMOVED: Public access not needed for security reasons

// GetUserInstance - For authenticated users (their own instance)
func GetUserInstance(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var instance models.Instance
	id := c.Param("id")

	// Ensure user can only access their own instances
	result := config.DB.Where("id = ? AND user_id = ?", id, userID).First(&instance)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
		return
	}

	var instanceDTO dto.UserInstanceDTO
	copier.Copy(&instanceDTO, &instance)

	c.JSON(http.StatusOK, instanceDTO)
}

// GetAdminInstance - Admin only (full data)
func GetAdminInstance(c *gin.Context) {
	userRole, exists := c.Get("userRole")
	if !exists || userRole != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	var instance models.Instance
	id := c.Param("id")
	result := config.DB.Preload("User").Preload("Team").Preload("Challenge").First(&instance, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Instance not found"})
		return
	}

	var instanceDTO dto.AdminInstanceDTO
	copier.Copy(&instanceDTO, &instance)

	c.JSON(http.StatusOK, instanceDTO)
}

// GetTeamInstances - For team members (shows team instances)
func GetTeamInstances(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get user's team ID
	var user models.User
	if err := config.DB.Select("team_id").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user team"})
		return
	}

	if user.TeamID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User is not part of a team"})
		return
	}

	var instances []models.Instance
	result := config.DB.Where("team_id = ?", *user.TeamID).Find(&instances)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	var instanceDTOs []dto.UserInstanceDTO
	for _, instance := range instances {
		var instanceDTO dto.UserInstanceDTO
		copier.Copy(&instanceDTO, &instance)
		instanceDTOs = append(instanceDTOs, instanceDTO)
	}

	c.JSON(http.StatusOK, instanceDTOs)
}
