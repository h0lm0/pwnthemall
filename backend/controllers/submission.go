package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"
	"pwnthemall/utils"

	"github.com/gin-gonic/gin"
)

// GetAllSubmissions returns all submissions with user and challenge info (admin only)
func GetAllSubmissions(c *gin.Context) {
	var submissions []models.Submission

	if err := config.DB.
		Preload("User.Team").
		Preload("Challenge").
		Preload("Challenge.Flags").
		Order("created_at DESC").
		Find(&submissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch submissions"})
		return
	}

	// Add isCorrect field to each submission
	type SubmissionResponse struct {
		models.Submission
		IsCorrect bool `json:"isCorrect"`
	}

	var response []SubmissionResponse
	for _, submission := range submissions {
		isCorrect := false
		
		// Check if this specific submission value matches any flag
		if submission.Challenge != nil && len(submission.Challenge.Flags) > 0 {
			for _, flag := range submission.Challenge.Flags {
				// Check if the submission value matches the flag (using hash comparison)
				if flag.Value == utils.HashFlag(submission.Value) {
					isCorrect = true
					break
				}
			}
		}

		response = append(response, SubmissionResponse{
			Submission: submission,
			IsCorrect:  isCorrect,
		})
	}

	c.JSON(http.StatusOK, response)
}
