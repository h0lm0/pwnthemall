package controllers

import (
	"encoding/json"
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/debug"
	"github.com/pwnthemall/pwnthemall/backend/dto"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

func UpdateChallengeAdmin(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	if err := config.DB.First(&challenge, id).Error; err != nil {
		utils.NotFoundError(c, "Challenge not found")
		return
	}

	var req dto.ChallengeAdminUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestError(c, err.Error())
		return
	}

	if req.Points != nil {
		challenge.Points = *req.Points
	}
	if req.DecayFormulaID != nil {
		challenge.DecayFormulaID = *req.DecayFormulaID
	}
	if req.EnableFirstBlood != nil {
		challenge.EnableFirstBlood = *req.EnableFirstBlood
	}

	// Convert []int to pq.Int64Array
	if req.FirstBloodBonuses != nil && len(*req.FirstBloodBonuses) > 0 {
		challenge.FirstBloodBonuses = *req.FirstBloodBonuses
	} else if req.FirstBloodBonuses != nil {
		challenge.FirstBloodBonuses = []int64{}
	}

	// Convert []string to pq.StringArray for badges
	if req.FirstBloodBadges != nil && len(*req.FirstBloodBadges) > 0 {
		challenge.FirstBloodBadges = *req.FirstBloodBadges
	} else if req.FirstBloodBadges != nil {
		challenge.FirstBloodBadges = []string{}
	}

	if err := config.DB.Save(&challenge).Error; err != nil {
		utils.InternalServerError(c, "Failed to update challenge")
		return
	}

	// Broadcast category update (challenge modified affects category)
	if utils.UpdatesHub != nil {
		if payload, err := json.Marshal(gin.H{
			"event":  "challenge-category",
			"action": "challenge_update",
		}); err == nil {
			utils.UpdatesHub.SendToAll(payload)
		}
	}

	// Recalculate points for all solves of this challenge with new values
	recalculateChallengePoints(challenge.ID)

	if req.EnableFirstBlood != nil && !*req.EnableFirstBlood && challenge.EnableFirstBlood {
		config.DB.Where("challenge_id = ?", challenge.ID).Delete(&models.FirstBlood{})
	}

	// Process hints from request
	if req.Hints != nil {
		for _, hintReq := range *req.Hints {
			debug.Log("Processing hint: ID=%d, Title=%s, Content=%s, Cost=%d", hintReq.ID, hintReq.Title, hintReq.Content, hintReq.Cost)
			if hintReq.ID > 0 {
				// Update existing hint
				var hint models.Hint
				if err := config.DB.First(&hint, hintReq.ID).Error; err == nil {
					hint.Title = hintReq.Title
					hint.Content = hintReq.Content
					hint.Cost = hintReq.Cost
					hint.IsActive = hintReq.IsActive
					hint.AutoActiveAt = hintReq.AutoActiveAt
					if err := config.DB.Save(&hint).Error; err != nil {
						debug.Log("Failed to update hint %d: %v", hint.ID, err)
					} else {
						debug.Log("Successfully updated hint %d", hint.ID)
					}
				}
			} else if hintReq.Content != "" {
				// Create new hint
				hint := models.Hint{
					ChallengeID:  challenge.ID,
					Title:        hintReq.Title,
					Content:      hintReq.Content,
					Cost:         hintReq.Cost,
					IsActive:     hintReq.IsActive,
					AutoActiveAt: hintReq.AutoActiveAt,
				}
				if err := config.DB.Create(&hint).Error; err != nil {
					debug.Log("Failed to create hint: %v", err)
				} else {
					debug.Log("Successfully created hint: ID=%d, Title=%s", hint.ID, hint.Title)
				}
			}
		}
			debug.Log("Processing hint: ID=%d, Title=%s, Content=%s, Cost=%d", hintReq.ID, hintReq.Title, hintReq.Content, hintReq.Cost)
			if hintReq.ID > 0 {
				// Update existing hint
				var hint models.Hint
				if err := config.DB.First(&hint, hintReq.ID).Error; err == nil {
					hint.Title = hintReq.Title
					hint.Content = hintReq.Content
					hint.Cost = hintReq.Cost
					hint.IsActive = hintReq.IsActive
					hint.AutoActiveAt = hintReq.AutoActiveAt
					if err := config.DB.Save(&hint).Error; err != nil {
						debug.Log("Failed to update hint %d: %v", hint.ID, err)
					} else {
						debug.Log("Successfully updated hint %d", hint.ID)
					}
				}
			} else if hintReq.Content != "" {
				// Create new hint
				hint := models.Hint{
					ChallengeID:  challenge.ID,
					Title:        hintReq.Title,
					Content:      hintReq.Content,
					Cost:         hintReq.Cost,
					IsActive:     hintReq.IsActive,
					AutoActiveAt: hintReq.AutoActiveAt,
				}
				if err := config.DB.Create(&hint).Error; err != nil {
					debug.Log("Failed to create hint: %v", err)
				} else {
					debug.Log("Successfully created hint: ID=%d, Title=%s", hint.ID, hint.Title)
				}
			}
		}
	}

	if err := config.DB.Preload("DecayFormula").Preload("Hints").Preload("FirstBlood").First(&challenge, challenge.ID).Error; err != nil {
		debug.Log("Failed to reload challenge: %v", err)
	} else {
		debug.Log("Reloaded challenge %d with %d hints", challenge.ID, len(challenge.Hints))
		for i, hint := range challenge.Hints {
			debug.Log("Hint %d: ID=%d, Title=%s, Content=%s", i, hint.ID, hint.Title, hint.Content)
		}
	}

	utils.OKResponse(c, challenge)
}

func UpdateChallengeGeneralAdmin(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	if err := config.DB.First(&challenge, id).Error; err != nil {
		utils.NotFoundError(c, "Challenge not found")
		return
	}

	var req dto.ChallengeGeneralUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequestError(c, err.Error())
		return
	}

	// Update challenge general fields
	challenge.Name = req.Name
	challenge.Description = req.Description
	challenge.Author = req.Author
	challenge.Hidden = *req.Hidden
	challenge.ChallengeCategoryID = *req.CategoryID
	challenge.ChallengeDifficultyID = *req.DifficultyID

	if err := config.DB.Save(&challenge).Error; err != nil {
		utils.InternalServerError(c, "Failed to update challenge")
		return
	}

	// Broadcast category update (challenge modified affects category)
	if utils.UpdatesHub != nil {
		if payload, err := json.Marshal(gin.H{
			"event":  "challenge-category",
			"action": "challenge_update",
		}); err == nil {
			utils.UpdatesHub.SendToAll(payload)
		}
	}

	utils.OKResponse(c, challenge)
}

func GetChallengeAdmin(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	if err := config.DB.Preload("DecayFormula").Preload("Hints").Preload("FirstBlood").First(&challenge, id).Error; err != nil {
		utils.NotFoundError(c, "Challenge not found")
		return
	}

	debug.Log("GetChallengeAdmin: Challenge %d has %d hints", challenge.ID, len(challenge.Hints))
	for i, hint := range challenge.Hints {
		debug.Log("Hint %d: ID=%d, Title=%s, Content=%s", i, hint.ID, hint.Title, hint.Content)
	}

	var decayFormulas []models.DecayFormula
	config.DB.Find(&decayFormulas)

	var challengeDifficulties []models.ChallengeDifficulty
	config.DB.Find(&challengeDifficulties)

	response := gin.H{
		"challenge":             challenge,
		"decayFormulas":         decayFormulas,
		"challengeDifficulties": challengeDifficulties,
	}

	utils.OKResponse(c, response)
}

func GetAllChallengesAdmin(c *gin.Context) {
	var challenges []models.Challenge
	if err := config.DB.Preload("ChallengeCategory").Preload("ChallengeType").Preload("ChallengeDifficulty").Find(&challenges).Error; err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.OKResponse(c, challenges)
}

func DeleteHint(c *gin.Context) {
	hintID := c.Param("hintId")

	if err := config.DB.Delete(&models.Hint{}, hintID).Error; err != nil {
		utils.InternalServerError(c, "Failed to delete hint")
		return
	}

	utils.OKResponse(c, gin.H{"message": "Hint deleted successfully"})
}

// recalculateChallengePoints recalculates points for all solves of a specific challenge
func recalculateChallengePoints(challengeID uint) {
	decayService := utils.NewDecay()

	// Get the challenge details
	var challenge models.Challenge
	if err := config.DB.First(&challenge, challengeID).Error; err != nil {
		debug.Log("Failed to fetch challenge %d for recalculation: %v", challengeID, err)
		return
	}

	// Delete existing FirstBlood entries for this challenge and recreate them
	if err := config.DB.Where("challenge_id = ?", challengeID).Delete(&models.FirstBlood{}).Error; err != nil {
		debug.Log("Failed to delete existing FirstBlood entries: %v", err)
	}

	// Get all solves for this challenge, ordered by creation time
	var solves []models.Solve
	if err := config.DB.Where("challenge_id = ?", challengeID).Order("created_at ASC").Find(&solves).Error; err != nil {
		debug.Log("Failed to fetch solves for challenge %d: %v", challengeID, err)
		return
	}

	// Recalculate points for each solve based on its position
	for i, solve := range solves {
		position := i
		newPoints := decayService.CalculateDecayedPoints(&challenge, position)

		// Add FirstBlood bonus if applicable
		firstBloodBonus := 0
		if challenge.EnableFirstBlood && len(challenge.FirstBloodBonuses) > 0 {
			if position < len(challenge.FirstBloodBonuses) {
				firstBloodBonus = int(challenge.FirstBloodBonuses[position])

				// Create FirstBlood entry
				badge := "trophy" // default badge
				if position < len(challenge.FirstBloodBadges) {
					badge = challenge.FirstBloodBadges[position]
				}

				firstBlood := models.FirstBlood{
					ChallengeID: challengeID,
					TeamID:      solve.TeamID,
					UserID:      solve.UserID,
					Bonuses:     []int64{int64(firstBloodBonus)},
					Badges:      []string{badge},
				}

				if err := config.DB.Create(&firstBlood).Error; err != nil {
					debug.Log("Failed to recreate FirstBlood entry: %v", err)
				}
			}
		}

		newPointsWithBonus := newPoints + firstBloodBonus

		if solve.Points != newPointsWithBonus {
			solve.Points = newPointsWithBonus
			if err := config.DB.Save(&solve).Error; err != nil {
				debug.Log("Failed to update solve for team %d, challenge %d: %v", solve.TeamID, solve.ChallengeID, err)
			} else {
				debug.Log("Updated solve points for team %d, challenge %d: %d -> %d (decay: %d, firstblood: %d)",
					solve.TeamID, solve.ChallengeID, solve.Points, newPointsWithBonus, newPoints, firstBloodBonus)
			}
		}
	}
}

// CheckAndActivateHints endpoint to manually activate ALL hints for admin
func CheckAndActivateHints(c *gin.Context) {
	var hints []models.Hint
	if err := config.DB.Find(&hints).Error; err != nil {
		debug.Log("Failed to fetch all hints: %v", err)
		utils.InternalServerError(c, "Failed to fetch hints")
		return
	}

	activatedCount := 0
	totalHints := len(hints)

	for _, hint := range hints {
		if !hint.IsActive {
			hint.IsActive = true
			if err := config.DB.Save(&hint).Error; err != nil {
				debug.Log("Failed to activate hint %d: %v", hint.ID, err)
			} else {
				debug.Log("Manually activated hint %d (%s) for challenge %d", hint.ID, hint.Title, hint.ChallengeID)
				activatedCount++
			}
		}
	}

	debug.Log("Manual activation completed: activated %d hints out of %d total hints", activatedCount, totalHints)
	utils.OKResponse(c, gin.H{
		"message":         "All hints activation completed",
		"activated_count": activatedCount,
		"total_hints":     totalHints,
		"already_active":  totalHints - activatedCount,
	})
}
