package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

// GetAllSubmissions returns all submissions with user and challenge info (admin only)
func GetAllSubmissions(c *gin.Context) {
	var submissions []models.Submission

	if err := config.DB.
		Preload("User.Team").
		Preload("Challenge").
		Order("created_at DESC").
		Find(&submissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch submissions"})
		return
	}

	c.JSON(http.StatusOK, submissions)
}
