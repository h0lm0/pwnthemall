package controllers

import (
	"pwnthemall/config"
	"pwnthemall/models"
	"pwnthemall/utils"

	"github.com/gin-gonic/gin"
)

// PurchaseHint allows a team to purchase a hint for points
func PurchaseHint(c *gin.Context) {
	hintID := c.Param("id")

	userI, exists := c.Get("user")
	if !exists {
		utils.UnauthorizedError(c, "unauthorized")
		return
	}
	user, ok := userI.(*models.User)
	if !ok {
		utils.InternalServerError(c, "user_wrong_type")
		return
	}

	if user.TeamID == nil {
		utils.BadRequestError(c, "no_team")
		return
	}

	// Start transaction
	tx := config.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Check if hint exists
	var hint models.Hint
	if err := tx.First(&hint, hintID).Error; err != nil {
		tx.Rollback()
		utils.NotFoundError(c, "hint_not_found")
		return
	}

	// Check if hint is active (can't purchase inactive hints)
	if !hint.IsActive {
		tx.Rollback()
		utils.BadRequestError(c, "hint_not_active")
		return
	}

	// Check if team already purchased this hint
	var existingPurchase models.HintPurchase
	if err := tx.Where("team_id = ? AND hint_id = ?", *user.TeamID, hint.ID).First(&existingPurchase).Error; err == nil {
		tx.Rollback()
		utils.BadRequestError(c, "hint_already_purchased")
		return
	}

	// Get team with current score
	var team models.Team
	if err := tx.Preload("Solves").First(&team, *user.TeamID).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "team_not_found")
		return
	}

	// Calculate team score
	totalScore := 0
	for _, solve := range team.Solves {
		totalScore += solve.Points
	}

	// Get total spent on hints
	var totalSpent int64
	tx.Model(&models.HintPurchase{}).
		Where("team_id = ?", *user.TeamID).
		Select("COALESCE(SUM(cost), 0)").
		Scan(&totalSpent)

	availableScore := totalScore - int(totalSpent)

	// Check if team has enough points
	if availableScore < hint.Cost {
		tx.Rollback()
		c.JSON(400, gin.H{
			"error":     "insufficient_points",
			"required":  hint.Cost,
			"available": availableScore,
		})
		return
	}

	// Create hint purchase record
	purchase := models.HintPurchase{
		TeamID: *user.TeamID,
		HintID: hint.ID,
		UserID: user.ID,
		Cost:   hint.Cost,
	}

	if err := tx.Create(&purchase).Error; err != nil {
		tx.Rollback()
		utils.InternalServerError(c, "failed_to_purchase_hint")
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		utils.InternalServerError(c, "failed_to_commit_transaction")
		return
	}

	utils.OKResponse(c, gin.H{
		"message": "hint_purchased",
		"hint":    hint,
		"cost":    hint.Cost,
	})
}
