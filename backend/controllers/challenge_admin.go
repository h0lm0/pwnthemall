package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

type ChallengeAdminUpdateRequest struct {
	Points           int    `json:"points"`
	DecayFormulaID   uint   `json:"decayFormulaId"`
	EnableFirstBlood bool   `json:"enableFirstBlood"`
	FirstBloodBonus  int    `json:"firstBloodBonus"`
	Hints            []HintRequest `json:"hints"`
}

type HintRequest struct {
	ID       uint   `json:"id,omitempty"`
	Content  string `json:"content"`
	Cost     int    `json:"cost"`
	IsActive bool   `json:"isActive"`
}

func UpdateChallengeAdmin(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	if err := config.DB.First(&challenge, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}

	var req ChallengeAdminUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update challenge basic fields
	challenge.Points = req.Points
	challenge.DecayFormulaID = req.DecayFormulaID
	challenge.EnableFirstBlood = req.EnableFirstBlood

	if err := config.DB.Save(&challenge).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update challenge"})
		return
	}

	// Update first blood bonus if enabled
	if req.EnableFirstBlood && req.FirstBloodBonus > 0 {
		// Check if first blood record exists
		var firstBlood models.FirstBlood
		if err := config.DB.Where("challenge_id = ?", challenge.ID).First(&firstBlood).Error; err != nil {
			// Create placeholder first blood record (will be populated when someone solves)
			firstBlood = models.FirstBlood{
				ChallengeID: challenge.ID,
				TeamID:      0, // Will be set when first solve occurs
				UserID:      0, // Will be set when first solve occurs
				Bonuses:     []int{req.FirstBloodBonus},
				Badges:      []string{"first-blood"},
			}
			config.DB.Create(&firstBlood)
		} else {
			// Update existing first blood bonus
			firstBlood.Bonuses = []int{req.FirstBloodBonus}
			config.DB.Save(&firstBlood)
		}
	}

	// Update hints
	for _, hintReq := range req.Hints {
		if hintReq.ID > 0 {
			// Update existing hint
			var hint models.Hint
			if err := config.DB.First(&hint, hintReq.ID).Error; err == nil {
				hint.Content = hintReq.Content
				hint.Cost = hintReq.Cost
				hint.IsActive = hintReq.IsActive
				config.DB.Save(&hint)
			}
		} else if hintReq.Content != "" {
			// Create new hint
			hint := models.Hint{
				ChallengeID: challenge.ID,
				TeamID:      0, // Global hint
				Content:     hintReq.Content,
				Cost:        hintReq.Cost,
				IsActive:    hintReq.IsActive,
			}
			config.DB.Create(&hint)
		}
	}

	c.JSON(http.StatusOK, challenge)
}

func GetChallengeAdmin(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	if err := config.DB.Preload("DecayFormula").Preload("Hints").Preload("FirstBlood").First(&challenge, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}

	// Get all decay formulas for dropdown
	var decayFormulas []models.DecayFormula
	config.DB.Find(&decayFormulas)

	response := gin.H{
		"challenge":     challenge,
		"decayFormulas": decayFormulas,
	}

	c.JSON(http.StatusOK, response)
}

func GetAllChallengesAdmin(c *gin.Context) {
	var challenges []models.Challenge
	if err := config.DB.Preload("ChallengeCategory").Preload("ChallengeType").Preload("ChallengeDifficulty").Find(&challenges).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, challenges)
}

func DeleteHint(c *gin.Context) {
	hintID := c.Param("hintId")
	
	if err := config.DB.Delete(&models.Hint{}, hintID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete hint"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Hint deleted successfully"})
}
