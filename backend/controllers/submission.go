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

	// Add isCorrect field to each submission
	type SubmissionResponse struct {
		models.Submission
		IsCorrect bool `json:"isCorrect"`
	}

	var response []SubmissionResponse
	for _, submission := range submissions {
		var solveCount int64
		config.DB.Model(&models.Solve{}).
			Where("user_id = ? AND challenge_id = ?", submission.UserID, submission.ChallengeID).
			Count(&solveCount)

		response = append(response, SubmissionResponse{
			Submission: submission,
			IsCorrect:  solveCount > 0,
		})
	}

	c.JSON(http.StatusOK, response)
}
