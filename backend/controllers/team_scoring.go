package controllers

import (
	"log"
	"pwnthemall/config"
	"pwnthemall/dto"
	"pwnthemall/models"
	"pwnthemall/utils"

	"github.com/gin-gonic/gin"
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

// GetTeamTimeline returns solve activity timeline for top teams (CTFd/TryHackMe style)
func GetTeamTimeline(c *gin.Context) {
	// Get top 3 teams from leaderboard
	var teams []models.Team
	if err := config.DB.Preload("Users").Find(&teams).Error; err != nil {
		utils.InternalServerError(c, "failed_to_fetch_teams")
		return
	}

	decayService := utils.NewDecay()
	type teamScore struct {
		team  models.Team
		score int
	}
	var teamScores []teamScore

	// Calculate scores for all teams
	for _, team := range teams {
		var solves []models.Solve
		if err := config.DB.Where("team_id = ?", team.ID).Find(&solves).Error; err != nil {
			continue
		}

		totalScore := 0
		for _, solve := range solves {
			var challenge models.Challenge
			if err := config.DB.First(&challenge, solve.ChallengeID).Error; err != nil {
				continue
			}

			var position int64
			config.DB.Model(&models.Solve{}).
				Where("challenge_id = ? AND created_at < ?", challenge.ID, solve.CreatedAt).
				Count(&position)

			currentPoints := decayService.CalculateDecayedPoints(&challenge, int(position))
			totalScore += currentPoints

			if challenge.EnableFirstBlood && len(challenge.FirstBloodBonuses) > 0 {
				pos := int(position)
				if pos < len(challenge.FirstBloodBonuses) {
					bonusValue := int(challenge.FirstBloodBonuses[pos])
					totalScore += bonusValue
				}
			}
		}

		var totalSpent int64
		config.DB.Model(&models.HintPurchase{}).
			Where("team_id = ?", team.ID).
			Select("COALESCE(SUM(cost), 0)").
			Scan(&totalSpent)

		finalScore := totalScore - int(totalSpent)
		teamScores = append(teamScores, teamScore{team: team, score: finalScore})
	}

	// Sort by score to get top 3
	for i := 0; i < len(teamScores)-1; i++ {
		for j := i + 1; j < len(teamScores); j++ {
			if teamScores[j].score > teamScores[i].score {
				teamScores[i], teamScores[j] = teamScores[j], teamScores[i]
			}
		}
	}

	// Get top 3 teams
	topTeams := make([]models.Team, 0, 3)
	for i := 0; i < len(teamScores) && i < 3; i++ {
		topTeams = append(topTeams, teamScores[i].team)
	}

	if len(topTeams) == 0 {
		utils.OKResponse(c, []interface{}{})
		return
	}

	// Get all solves for top teams ordered by time
	var allSolves []models.Solve
	teamIDs := make([]uint, len(topTeams))
	for i, team := range topTeams {
		teamIDs[i] = team.ID
	}

	if err := config.DB.Where("team_id IN ?", teamIDs).
		Order("created_at ASC").
		Find(&allSolves).Error; err != nil {
		utils.InternalServerError(c, "failed_to_fetch_solves")
		return
	}

	// Build timeline data
	type timelinePoint struct {
		Time      string         `json:"time"`
		Team1     int            `json:"team1"`
		Team2     int            `json:"team2"`
		Team3     int            `json:"team3"`
		Team1Name string         `json:"team1Name"`
		Team2Name string         `json:"team2Name"`
		Team3Name string         `json:"team3Name"`
	}

	timeline := []timelinePoint{}
	teamScoresMap := make(map[uint]int) // Current cumulative score per team
	
	// Initialize team names
	var team1Name, team2Name, team3Name string
	if len(topTeams) > 0 {
		team1Name = topTeams[0].Name
	}
	if len(topTeams) > 1 {
		team2Name = topTeams[1].Name
	}
	if len(topTeams) > 2 {
		team3Name = topTeams[2].Name
	}

	// Process each solve chronologically
	for _, solve := range allSolves {
		var challenge models.Challenge
		if err := config.DB.First(&challenge, solve.ChallengeID).Error; err != nil {
			continue
		}

		// Calculate points for this solve
		var position int64
		config.DB.Model(&models.Solve{}).
			Where("challenge_id = ? AND created_at <= ?", challenge.ID, solve.CreatedAt).
			Count(&position)
		position-- // Convert to 0-based

		points := decayService.CalculateDecayedPoints(&challenge, int(position))

		if challenge.EnableFirstBlood && len(challenge.FirstBloodBonuses) > 0 {
			pos := int(position)
			if pos < len(challenge.FirstBloodBonuses) {
				bonusValue := int(challenge.FirstBloodBonuses[pos])
				points += bonusValue
			}
		}

		// Update team score
		teamScoresMap[solve.TeamID] += points

		// Create timeline point with all team scores
		point := timelinePoint{
			Time:      solve.CreatedAt.Format("15:04"),
			Team1Name: team1Name,
			Team2Name: team2Name,
			Team3Name: team3Name,
		}

		// Get current scores for all top teams
		if len(topTeams) > 0 {
			point.Team1 = teamScoresMap[topTeams[0].ID]
		}
		if len(topTeams) > 1 {
			point.Team2 = teamScoresMap[topTeams[1].ID]
		}
		if len(topTeams) > 2 {
			point.Team3 = teamScoresMap[topTeams[2].ID]
		}

		timeline = append(timeline, point)
	}

	// If no solves yet, return empty array
	if len(timeline) == 0 {
		utils.OKResponse(c, []interface{}{})
		return
	}

	utils.OKResponse(c, timeline)
}
