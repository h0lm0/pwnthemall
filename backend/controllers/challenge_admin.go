package controllers

import (
	"log"
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"
	"pwnthemall/utils"

	"github.com/gin-gonic/gin"
)

type ChallengeAdminUpdateRequest struct {
	Points            int           `json:"points"`
	DecayFormulaID    uint          `json:"decayFormulaId"`
	EnableFirstBlood  bool          `json:"enableFirstBlood"`
	FirstBloodBonuses []int         `json:"firstBloodBonuses"`
	Hints             []HintRequest `json:"hints"`
}

type ChallengeGeneralUpdateRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Author      string `json:"author"`
	Hidden      bool   `json:"hidden"`
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

	// Gérer le DecayFormulaID - si 0 ou nil, on met à nil pour désactiver le decay
	challenge.DecayFormulaID = req.DecayFormulaID

	challenge.EnableFirstBlood = req.EnableFirstBlood

	// Convert []int to pq.Int64Array
	if len(req.FirstBloodBonuses) > 0 {
		int64Array := make([]int64, len(req.FirstBloodBonuses))
		for i, v := range req.FirstBloodBonuses {
			int64Array[i] = int64(v)
		}
		challenge.FirstBloodBonuses = int64Array
	} else {
		challenge.FirstBloodBonuses = []int64{}
	}

	if err := config.DB.Save(&challenge).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update challenge"})
		return
	}

	// Recalculate points for all solves of this challenge with new values
	recalculateChallengePoints(challenge.ID)

	// Pour FirstBlood, on sauvegarde juste l'état "enabled" et le bonus
	// L'enregistrement FirstBlood sera créé quand une équipe résoudra le challenge
	if !req.EnableFirstBlood {
		// Si FirstBlood est désactivé, supprimer l'enregistrement existant
		config.DB.Where("challenge_id = ?", challenge.ID).Delete(&models.FirstBlood{})
	}

	// Gestion des hints - approche complète de synchronisation
	// 1. Récupérer tous les hints existants pour ce challenge
	var existingHints []models.Hint
	config.DB.Where("challenge_id = ?", challenge.ID).Find(&existingHints)

	// 2. Créer une map des IDs des hints dans la requête
	requestHintIDs := make(map[uint]bool)
	for _, hintReq := range req.Hints {
		if hintReq.ID > 0 {
			requestHintIDs[hintReq.ID] = true
		}
	}

	// 3. Supprimer les hints qui ne sont plus dans la liste
	for _, existingHint := range existingHints {
		if !requestHintIDs[existingHint.ID] {
			if err := config.DB.Delete(&existingHint).Error; err != nil {
				log.Printf("Failed to delete hint %d: %v", existingHint.ID, err)
			}
		}
	}

	// 4. Créer ou mettre à jour les hints de la requête
	for _, hintReq := range req.Hints {
		if hintReq.ID > 0 {
			// Mettre à jour un hint existant
			var hint models.Hint
			if err := config.DB.First(&hint, hintReq.ID).Error; err == nil {
				hint.Content = hintReq.Content
				hint.Cost = hintReq.Cost
				hint.IsActive = hintReq.IsActive
				if err := config.DB.Save(&hint).Error; err != nil {
					log.Printf("Failed to update hint %d: %v", hint.ID, err)
				}
			}
		} else if hintReq.Content != "" {
			// Créer un nouveau hint
			hint := models.Hint{
				ChallengeID: challenge.ID,
				Content:     hintReq.Content,
				Cost:        hintReq.Cost,
				IsActive:    hintReq.IsActive,
			}
			if err := config.DB.Create(&hint).Error; err != nil {
				log.Printf("Failed to create hint: %v", err)
			}
		}
	}

	c.JSON(http.StatusOK, challenge)
}

func UpdateChallengeGeneralAdmin(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	if err := config.DB.First(&challenge, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}

	var req ChallengeGeneralUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update challenge general fields
	challenge.Name = req.Name
	challenge.Description = req.Description
	challenge.Author = req.Author
	challenge.Hidden = req.Hidden

	if err := config.DB.Save(&challenge).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update challenge"})
		return
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

// recalculateChallengePoints recalculates points for all solves of a specific challenge
func recalculateChallengePoints(challengeID uint) {
	decayService := utils.NewDecay()

	// Get the challenge details
	var challenge models.Challenge
	if err := config.DB.First(&challenge, challengeID).Error; err != nil {
		log.Printf("Failed to fetch challenge %d for recalculation: %v", challengeID, err)
		return
	}

	// Get all solves for this challenge, ordered by creation time
	var solves []models.Solve
	if err := config.DB.Where("challenge_id = ?", challengeID).Order("created_at ASC").Find(&solves).Error; err != nil {
		log.Printf("Failed to fetch solves for challenge %d: %v", challengeID, err)
		return
	}

	// Recalculate points for each solve based on its position
	for i, solve := range solves {
		// Position is 0-based (first solve = position 0)
		position := i
		newPoints := decayService.CalculateDecayedPoints(&challenge, position)

		// Update if points have changed
		if solve.Points != newPoints {
			solve.Points = newPoints
			if err := config.DB.Save(&solve).Error; err != nil {
				log.Printf("Failed to update solve for team %d, challenge %d: %v", solve.TeamID, solve.ChallengeID, err)
			} else {
				log.Printf("Updated solve points for team %d, challenge %d: %d -> %d", solve.TeamID, solve.ChallengeID, solve.Points, newPoints)
			}
		}
	}
}
