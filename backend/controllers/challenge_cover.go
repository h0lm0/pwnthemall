package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

// GetChallengeCover serves the cover image for a challenge
func GetChallengeCover(c *gin.Context) {
	id := c.Param("id")
	
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "challenge id required"})
		return
	}

	// Lookup challenge to get slug and cover image filename
	var challenge models.Challenge
	if err := config.DB.Where("id = ?", id).First(&challenge).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "challenge not found"})
		return
	}

	if challenge.CoverImg == "" {
		c.JSON(http.StatusNotFound, gin.H{"error": "no cover image configured"})
		return
	}

	// Retrieve cover image from MinIO
	imageData, contentType, err := utils.GetChallengeCoverImage(challenge.Slug, challenge.CoverImg)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "cover image not found"})
		return
	}

	// Set proper headers for caching and security
	c.Header("Content-Type", contentType)
	c.Header("Cache-Control", "public, max-age=31536000, immutable") // Cache for 1 year
	c.Header("X-Content-Type-Options", "nosniff")                    // Prevent MIME sniffing
	
	// Serve image data
	c.Data(http.StatusOK, contentType, imageData)
}
