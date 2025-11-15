package controllers

import (
	"log"

	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/dto"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

// GetLeaderboard calculates and returns team rankings with current points
func GetLeaderboard(c *gin.Context) {
	var teams []models.Team
	if err := config.DB.Preload("Users").Find(&teams).Error; err != nil {
		utils.InternalServerError(c, "failed_to_fetch_teams")
		return
	}

	decayService := utils.NewDecay()
	var leaderboard []dto.TeamScore

	for _, team := range teams {
		var solves []models.Solve
		if err := config.DB.Where("team_id = ?", team.ID).Find(&solves).Error; err != nil {
			continue
		}

		totalScore := 0
		for _, solve := range solves {
			// Get challenge details for current point calculation
			var challenge models.Challenge
			if err := config.DB.First(&challenge, solve.ChallengeID).Error; err != nil {
				continue
			}

			// Calculate current solve count for this challenge
			var solveCount int64
			config.DB.Model(&models.Solve{}).Where("challenge_id = ?", challenge.ID).Count(&solveCount)

			// Get the position of this particular solve (0-based)
			var position int64
			config.DB.Model(&models.Solve{}).
				Where("challenge_id = ? AND created_at < ?", challenge.ID, solve.CreatedAt).
				Count(&position)

			// Calculate points for this solve with current decay settings
			currentPoints := decayService.CalculateDecayedPoints(&challenge, int(position))
			totalScore += currentPoints

			// Add FirstBlood bonus if applicable
			if challenge.EnableFirstBlood && len(challenge.FirstBloodBonuses) > 0 {
				pos := int(position)
				if pos < len(challenge.FirstBloodBonuses) {
					bonusValue := int(challenge.FirstBloodBonuses[pos])
					totalScore += bonusValue
				}
			}
		}

		// Subtract hints cost from total score
		var totalSpent int64
		config.DB.Model(&models.HintPurchase{}).
			Where("team_id = ?", team.ID).
			Select("COALESCE(SUM(cost), 0)").
			Scan(&totalSpent)

		finalScore := totalScore - int(totalSpent)

		leaderboard = append(leaderboard, dto.TeamScore{
			Team:       team,
			TotalScore: finalScore,
			SolveCount: len(solves),
		})
	}

	// Sort by total score (descending)
	for i := 0; i < len(leaderboard)-1; i++ {
		for j := i + 1; j < len(leaderboard); j++ {
			if leaderboard[j].TotalScore > leaderboard[i].TotalScore {
				leaderboard[i], leaderboard[j] = leaderboard[j], leaderboard[i]
			}
		}
	}

	utils.OKResponse(c, leaderboard)
}

// RecalculateTeamPoints recalculates all solve points for all teams based on current challenge values
func RecalculateTeamPoints(c *gin.Context) {
	decayService := utils.NewDecay()

	// Delete all existing FirstBlood entries and recreate them
	if err := config.DB.Delete(&models.FirstBlood{}, "1=1").Error; err != nil {
		log.Printf("Failed to delete existing FirstBlood entries: %v", err)
	}

	// Get all solves grouped by challenge and ordered by creation time
	var solves []models.Solve
	if err := config.DB.Order("challenge_id ASC, created_at ASC").Find(&solves).Error; err != nil {
		utils.InternalServerError(c, "failed_to_fetch_solves")
		return
	}

	updatedCount := 0
	challengePositions := make(map[uint]int) // Track position per challenge

	for _, solve := range solves {
		// Get challenge details
		var challenge models.Challenge
		if err := config.DB.First(&challenge, solve.ChallengeID).Error; err != nil {
			continue
		}

		// Get current position for this challenge
		position := challengePositions[solve.ChallengeID]
		challengePositions[solve.ChallengeID]++

		// Calculate new points with current decay settings
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
					ChallengeID: challenge.ID,
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

		// Update if points have changed
		if solve.Points != newPointsWithBonus {
			solve.Points = newPointsWithBonus
			if err := config.DB.Save(&solve).Error; err != nil {
				log.Printf("Failed to update solve for team %d, challenge %d: %v", solve.TeamID, solve.ChallengeID, err)
				continue
			}
			updatedCount++
		}
	}

	utils.OKResponse(c, gin.H{
		"message":        "points_recalculated",
		"updated_solves": updatedCount,
	})
}

// GetTeamScore returns the current score for the user's team
func GetTeamScore(c *gin.Context) {
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

	// Get team with solves
	var team models.Team
	if err := config.DB.Preload("Solves").First(&team, *user.TeamID).Error; err != nil {
		utils.InternalServerError(c, "team_not_found")
		return
	}

	// Calculate total score
	totalScore := 0
	for _, solve := range team.Solves {
		totalScore += solve.Points
	}

	// Get total spent on hints
	var totalSpent int64
	config.DB.Model(&models.HintPurchase{}).
		Where("team_id = ?", *user.TeamID).
		Select("COALESCE(SUM(cost), 0)").
		Scan(&totalSpent)

	utils.OKResponse(c, gin.H{
		"totalScore":     totalScore,
		"availableScore": totalScore - int(totalSpent),
		"spentOnHints":   int(totalSpent),
	})
}
