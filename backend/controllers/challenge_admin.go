package controllers

import (
	"log"
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"
	"pwnthemall/utils"
	"time"

	"github.com/gin-gonic/gin"
)

type ChallengeAdminUpdateRequest struct {
	Points            int           `json:"points"`
	DecayFormulaID    uint          `json:"decayFormulaId"`
	EnableFirstBlood  bool          `json:"enableFirstBlood"`
	FirstBloodBonuses []int         `json:"firstBloodBonuses"`
	FirstBloodBadges  []string      `json:"firstBloodBadges"`
	Hints             []HintRequest `json:"hints"`
}

type ChallengeGeneralUpdateRequest struct {
	Name         string `json:"name"`
	Description  string `json:"description"`
	Author       string `json:"author"`
	Hidden       bool   `json:"hidden"`
	CategoryID   uint   `json:"categoryId"`
	DifficultyID uint   `json:"difficultyId"`
}

type HintRequest struct {
	ID           uint       `json:"id,omitempty"`
	Title        string     `json:"title"`
	Content      string     `json:"content"`
	Cost         int        `json:"cost"`
	IsActive     bool       `json:"isActive"`
	AutoActiveAt *time.Time `json:"autoActiveAt,omitempty"`
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

	challenge.Points = req.Points
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

	// Convert []string to pq.StringArray for badges
	if len(req.FirstBloodBadges) > 0 {
		stringArray := make([]string, len(req.FirstBloodBadges))
		copy(stringArray, req.FirstBloodBadges)
		challenge.FirstBloodBadges = stringArray
	} else {
		challenge.FirstBloodBadges = []string{}
	}

	if err := config.DB.Save(&challenge).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update challenge"})
		return
	}

	// Recalculate points for all solves of this challenge with new values
	recalculateChallengePoints(challenge.ID)

	if !req.EnableFirstBlood {
		config.DB.Where("challenge_id = ?", challenge.ID).Delete(&models.FirstBlood{})
	}

	// Process hints from request
	for _, hintReq := range req.Hints {
		log.Printf("Processing hint: ID=%d, Title=%s, Content=%s, Cost=%d", hintReq.ID, hintReq.Title, hintReq.Content, hintReq.Cost)

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
					log.Printf("Failed to update hint %d: %v", hint.ID, err)
				} else {
					log.Printf("Successfully updated hint %d", hint.ID)
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
				log.Printf("Failed to create hint: %v", err)
			} else {
				log.Printf("Successfully created hint: ID=%d, Title=%s", hint.ID, hint.Title)
			}
		}
	}

	if err := config.DB.Preload("DecayFormula").Preload("Hints").Preload("FirstBlood").First(&challenge, challenge.ID).Error; err != nil {
		log.Printf("Failed to reload challenge: %v", err)
	} else {
		log.Printf("Reloaded challenge %d with %d hints", challenge.ID, len(challenge.Hints))
		for i, hint := range challenge.Hints {
			log.Printf("Hint %d: ID=%d, Title=%s, Content=%s", i, hint.ID, hint.Title, hint.Content)
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
	challenge.ChallengeCategoryID = req.CategoryID
	challenge.ChallengeDifficultyID = req.DifficultyID

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

	log.Printf("GetChallengeAdmin: Challenge %d has %d hints", challenge.ID, len(challenge.Hints))
	for i, hint := range challenge.Hints {
		log.Printf("Hint %d: ID=%d, Title=%s, Content=%s", i, hint.ID, hint.Title, hint.Content)
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

	// Delete existing FirstBlood entries for this challenge and recreate them
	if err := config.DB.Where("challenge_id = ?", challengeID).Delete(&models.FirstBlood{}).Error; err != nil {
		log.Printf("Failed to delete existing FirstBlood entries: %v", err)
	}

	// Get all solves for this challenge, ordered by creation time
	var solves []models.Solve
	if err := config.DB.Where("challenge_id = ?", challengeID).Order("created_at ASC").Find(&solves).Error; err != nil {
		log.Printf("Failed to fetch solves for challenge %d: %v", challengeID, err)
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
					log.Printf("Failed to recreate FirstBlood entry: %v", err)
				}
			}
		}

		newPointsWithBonus := newPoints + firstBloodBonus

		if solve.Points != newPointsWithBonus {
			solve.Points = newPointsWithBonus
			if err := config.DB.Save(&solve).Error; err != nil {
				log.Printf("Failed to update solve for team %d, challenge %d: %v", solve.TeamID, solve.ChallengeID, err)
			} else {
				log.Printf("Updated solve points for team %d, challenge %d: %d -> %d (decay: %d, firstblood: %d)",
					solve.TeamID, solve.ChallengeID, solve.Points, newPointsWithBonus, newPoints, firstBloodBonus)
			}
		}
	}
}

// ActivateScheduledHints activates hints that should be auto-activated based on their AutoActiveAt time
func ActivateScheduledHints() {
	utils.ActivateScheduledHints()
}

// CheckAndActivateHints endpoint to manually trigger hint activation check (for admin)
func CheckAndActivateHints(c *gin.Context) {
	utils.ActivateScheduledHints()
	c.JSON(http.StatusOK, gin.H{"message": "Hint activation check completed"})
}
