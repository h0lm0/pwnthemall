package controllers

import (
	"log"
	"sort"

	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/dto"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

// Constants for query strings
const (
	queryTeamID             = "team_id = ?"
	queryChallengeCreatedAt = "challenge_id = ? AND created_at < ?"
	queryChallengeCreatedAtLTE = "challenge_id = ? AND created_at <= ?"
	queryCoalesceSumCost    = "COALESCE(SUM(cost), 0)"
)

// Helper functions for score calculation

// calculateSolvePointsWithDecay calculates points for a single solve including first blood bonus with decay
func calculateSolvePointsWithDecay(solve *models.Solve, challenge *models.Challenge, position int, decayService *utils.DecayService) int {
	currentPoints := decayService.CalculateDecayedPoints(challenge, position)
	
	// Add FirstBlood bonus if applicable
	if challenge.EnableFirstBlood && len(challenge.FirstBloodBonuses) > 0 {
		if position < len(challenge.FirstBloodBonuses) {
			bonusValue := int(challenge.FirstBloodBonuses[position])
			currentPoints += bonusValue
		}
	}
	
	return currentPoints
}

// getSolvePosition gets the 0-based position of a solve for a challenge
func getSolvePosition(challengeID uint, createdAt interface{}) int {
	var position int64
	config.DB.Model(&models.Solve{}).
		Where(queryChallengeCreatedAt, challengeID, createdAt).
		Count(&position)
	return int(position)
}

// getTeamHintsCost calculates total spent on hints for a team
func getTeamHintsCost(teamID uint) int {
	var totalSpent int64
	config.DB.Model(&models.HintPurchase{}).
		Where(queryTeamID, teamID).
		Select(queryCoalesceSumCost).
		Scan(&totalSpent)
	return int(totalSpent)
}

// calculateTeamScore calculates total score for a team's solves
func calculateTeamScore(teamID uint, decayService *utils.DecayService) (int, error) {
	var solves []models.Solve
	if err := config.DB.Where(queryTeamID, teamID).Find(&solves).Error; err != nil {
		return 0, err
	}

	totalScore := 0
	for _, solve := range solves {
		var challenge models.Challenge
		if err := config.DB.First(&challenge, solve.ChallengeID).Error; err != nil {
			continue
		}

		position := getSolvePosition(challenge.ID, solve.CreatedAt)
				totalScore += calculateSolvePointsWithDecay(&solve, &challenge, position, decayService)
	}

	return totalScore, nil
}

// sortLeaderboard sorts leaderboard by total score in descending order
func sortLeaderboard(leaderboard []dto.TeamScore) {
	sort.Slice(leaderboard, func(i, j int) bool {
		return leaderboard[i].TotalScore > leaderboard[j].TotalScore
	})
}

// calculateFirstBloodBonusForScoring determines the first blood bonus for a solve position during scoring recalculation
func calculateFirstBloodBonusForScoring(challenge *models.Challenge, position int) int {
	if !challenge.EnableFirstBlood || len(challenge.FirstBloodBonuses) == 0 {
		return 0
	}
	
	if position < len(challenge.FirstBloodBonuses) {
		return int(challenge.FirstBloodBonuses[position])
	}
	
	return 0
}

// createFirstBloodEntryForRecalc creates a FirstBlood database entry during recalculation
func createFirstBloodEntryForRecalc(challenge *models.Challenge, solve *models.Solve, position int, bonus int) error {
	badge := "trophy" // default badge
	if position < len(challenge.FirstBloodBadges) {
		badge = challenge.FirstBloodBadges[position]
	}

	firstBlood := models.FirstBlood{
		ChallengeID: challenge.ID,
		TeamID:      solve.TeamID,
		UserID:      solve.UserID,
		Bonuses:     []int64{int64(bonus)},
		Badges:      []string{badge},
	}

	return config.DB.Create(&firstBlood).Error
}

// processSolveRecalculation processes a single solve during point recalculation
func processSolveRecalculation(solve *models.Solve, position int, decayService *utils.DecayService) (int, error) {
	var challenge models.Challenge
	if err := config.DB.First(&challenge, solve.ChallengeID).Error; err != nil {
		return 0, err
	}

	newPoints := decayService.CalculateDecayedPoints(&challenge, position)
	firstBloodBonus := calculateFirstBloodBonusForScoring(&challenge, position)

	if firstBloodBonus > 0 {
		if err := createFirstBloodEntryForRecalc(&challenge, solve, position, firstBloodBonus); err != nil {
			log.Printf("Failed to recreate FirstBlood entry: %v", err)
		}
	}

	return newPoints + firstBloodBonus, nil
}

// teamScore holds team and its calculated score
type teamScore struct {
	team  models.Team
	score int
}

// calculateTeamScoreWithHints calculates team score including hint costs
func calculateTeamScoreWithHints(team models.Team, decayService *utils.DecayService) teamScore {
	totalScore, err := calculateTeamScore(team.ID, decayService)
	if err != nil {
		return teamScore{team: team, score: 0}
	}

	hintsCost := getTeamHintsCost(team.ID)
	return teamScore{team: team, score: totalScore - hintsCost}
}

// getTopTeams returns top N teams sorted by score
func getTopTeams(teams []models.Team, decayService *utils.DecayService, topN int) []models.Team {
	var teamScores []teamScore

	for _, team := range teams {
		teamScores = append(teamScores, calculateTeamScoreWithHints(team, decayService))
	}

	// Sort by score descending
	sort.Slice(teamScores, func(i, j int) bool {
		return teamScores[i].score > teamScores[j].score
	})

	// Extract top N teams
	topTeams := make([]models.Team, 0, topN)
	for i := 0; i < len(teamScores) && i < topN; i++ {
		topTeams = append(topTeams, teamScores[i].team)
	}

	return topTeams
}

// timelinePoint represents a point in the team timeline
type timelinePoint struct {
	Time      string `json:"time"`
	Team1     int    `json:"team1"`
	Team2     int    `json:"team2"`
	Team3     int    `json:"team3"`
	Team1Name string `json:"team1Name"`
	Team2Name string `json:"team2Name"`
	Team3Name string `json:"team3Name"`
}

// getTeamNames extracts team names from top teams slice
func getTeamNames(topTeams []models.Team) (string, string, string) {
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
	return team1Name, team2Name, team3Name
}

// calculateSolvePointsForTimeline calculates points for a solve including position lookup
func calculateSolvePointsForTimeline(solve *models.Solve, challenge *models.Challenge, decayService *utils.DecayService) int {
	var position int64
	config.DB.Model(&models.Solve{}).
		Where(queryChallengeCreatedAtLTE, challenge.ID, solve.CreatedAt).
		Count(&position)
	position-- // Convert to 0-based

	points := decayService.CalculateDecayedPoints(challenge, int(position))
	points += calculateFirstBloodBonusForScoring(challenge, int(position))

	return points
}

// buildTimelinePoint creates a timeline point with current scores
func buildTimelinePoint(solve *models.Solve, topTeams []models.Team, teamScoresMap map[uint]int, team1Name, team2Name, team3Name string) timelinePoint {
	point := timelinePoint{
		Time:      solve.CreatedAt.Format("15:04"),
		Team1Name: team1Name,
		Team2Name: team2Name,
		Team3Name: team3Name,
	}

	if len(topTeams) > 0 {
		point.Team1 = teamScoresMap[topTeams[0].ID]
	}
	if len(topTeams) > 1 {
		point.Team2 = teamScoresMap[topTeams[1].ID]
	}
	if len(topTeams) > 2 {
		point.Team3 = teamScoresMap[topTeams[2].ID]
	}

	return point
}

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
		totalScore, err := calculateTeamScore(team.ID, decayService)
		if err != nil {
			continue
		}

		hintsCost := getTeamHintsCost(team.ID)
		finalScore := totalScore - hintsCost

		var solveCount int64
		config.DB.Model(&models.Solve{}).Where(queryTeamID, team.ID).Count(&solveCount)

		leaderboard = append(leaderboard, dto.TeamScore{
			Team:       team,
			TotalScore: finalScore,
			SolveCount: int(solveCount),
		})
	}

	sortLeaderboard(leaderboard)
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
		position := challengePositions[solve.ChallengeID]
		challengePositions[solve.ChallengeID]++

		newPointsWithBonus, err := processSolveRecalculation(&solve, position, decayService)
		if err != nil {
			continue
		}

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
	var teams []models.Team
	if err := config.DB.Preload("Users").Find(&teams).Error; err != nil {
		utils.InternalServerError(c, "failed_to_fetch_teams")
		return
	}

	decayService := utils.NewDecay()
	topTeams := getTopTeams(teams, decayService, 3)

	if len(topTeams) == 0 {
		utils.OKResponse(c, []interface{}{})
		return
	}

	// Get all solves for top teams ordered by time
	teamIDs := make([]uint, len(topTeams))
	for i, team := range topTeams {
		teamIDs[i] = team.ID
	}

	var allSolves []models.Solve
	if err := config.DB.Where("team_id IN ?", teamIDs).
		Order("created_at ASC").
		Find(&allSolves).Error; err != nil {
		utils.InternalServerError(c, "failed_to_fetch_solves")
		return
	}

	timeline := buildTimeline(allSolves, topTeams, decayService)

	if len(timeline) == 0 {
		utils.OKResponse(c, []interface{}{})
		return
	}

	utils.OKResponse(c, timeline)
}

// buildTimeline constructs the timeline from solves
func buildTimeline(allSolves []models.Solve, topTeams []models.Team, decayService *utils.DecayService) []timelinePoint {
	timeline := []timelinePoint{}
	teamScoresMap := make(map[uint]int)
	team1Name, team2Name, team3Name := getTeamNames(topTeams)

	for _, solve := range allSolves {
		var challenge models.Challenge
		if err := config.DB.First(&challenge, solve.ChallengeID).Error; err != nil {
			continue
		}

		points := calculateSolvePointsForTimeline(&solve, &challenge, decayService)
		teamScoresMap[solve.TeamID] += points

		point := buildTimelinePoint(&solve, topTeams, teamScoresMap, team1Name, team2Name, team3Name)
		timeline = append(timeline, point)
	}

	return timeline
}
