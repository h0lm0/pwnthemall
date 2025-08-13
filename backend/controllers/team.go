package controllers

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"
	"pwnthemall/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// GetTeams : liste toutes les équipes
func GetTeams(c *gin.Context) {
	var teams []models.Team
	if err := config.DB.Preload("Users").Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, teams)
}

// GetTeam : infos d'une équipe + membres
func GetTeam(c *gin.Context) {
	id := c.Param("id")
	var team models.Team
	if err := config.DB.First(&team, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
		return
	}
	var members []models.User
	if err := config.DB.Where("team_id = ?", team.ID).Find(&members).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// Compute per-member points by attributing each team solve to the user whose submission led to it
	// IMPORTANT: JSON only supports string keys for maps; use string keys to avoid marshal errors
	memberPoints := map[string]int{}
	var totalPoints int

	// Fetch all solves for this team
	var solves []models.Solve
	if err := config.DB.Where("team_id = ?", team.ID).Order("created_at ASC").Find(&solves).Error; err == nil {
		for _, solve := range solves {
			// Find the submission that led to this solve: the latest submission for this challenge
			// by a member of the team at or before the solve time
			var submission models.Submission
			subRes := config.DB.
				Where("challenge_id = ? AND user_id IN (SELECT id FROM users WHERE team_id = ?) AND created_at <= ?",
					solve.ChallengeID, team.ID, solve.CreatedAt).
				Order("created_at DESC").
				First(&submission)
			if subRes.Error == nil && submission.UserID != 0 {
				key := fmt.Sprintf("%d", submission.UserID)
				memberPoints[key] += solve.Points
			}
			totalPoints += solve.Points
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"team":         team,
		"members":      members,
		"memberPoints": memberPoints,
		"totalPoints":  totalPoints,
	})
}

// CreateTeam : crée une équipe et assigne l'utilisateur courant
func CreateTeam(c *gin.Context) {
	var input struct {
		Name     string `json:"name" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_input"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}
	if user.TeamID != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_already_in_team"})
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal_server_error"})
		return
	}
	team := models.Team{
		Name:      input.Name,
		Password:  string(hashedPassword),
		CreatorID: userID.(uint),
	}
	if err := config.DB.Create(&team).Error; err != nil {
		// Check if it's a unique constraint violation for team name
		if strings.Contains(err.Error(), "duplicate key") && strings.Contains(err.Error(), "uni_teams_name") {
			c.JSON(http.StatusConflict, gin.H{"error": "team_name_already_exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "team_creation_failed"})
		return
	}
	user.TeamID = &team.ID
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user_update_failed"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"team": team})
}

// JoinTeam : rejoindre une équipe (par nom ou id + mot de passe)
func JoinTeam(c *gin.Context) {
	var input struct {
		TeamID   *uint  `json:"teamId"`
		Name     string `json:"name"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid_input"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}
	if user.TeamID != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_already_in_team"})
		return
	}
	var team models.Team
	if input.TeamID != nil {
		if err := config.DB.First(&team, *input.TeamID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "team_not_found"})
			return
		}
	} else if input.Name != "" {
		if err := config.DB.Where("name = ?", input.Name).First(&team).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "team_not_found"})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "team_id_or_name_required"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(team.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_password"})
		return
	}
	user.TeamID = &team.ID
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "team_join_failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Joined team", "team": team})
}

// deleteTeamCompletely removes a team and all its related records
func deleteTeamCompletely(teamID uint) error {
	// Use a transaction to ensure all operations succeed or fail together
	return config.DB.Transaction(func(tx *gorm.DB) error {
		// Get all users in this team for submissions cleanup
		var userIds []uint
		tx.Model(&models.User{}).Where("team_id = ?", teamID).Pluck("id", &userIds)

		// Delete Submission records for all team members
		if len(userIds) > 0 {
			if err := tx.Where("user_id IN ?", userIds).Delete(&models.Submission{}).Error; err != nil {
				log.Printf("Failed to delete submissions for team %d: %v", teamID, err)
				return err
			}
		}

		// Delete Instance records
		if err := tx.Where("team_id = ?", teamID).Delete(&models.Instance{}).Error; err != nil {
			log.Printf("Failed to delete instances for team %d: %v", teamID, err)
			return err
		}

		// Delete DynamicFlag records
		if err := tx.Where("team_id = ?", teamID).Delete(&models.DynamicFlag{}).Error; err != nil {
			log.Printf("Failed to delete dynamic flags for team %d: %v", teamID, err)
			return err
		}

		// Delete Solve records (these should cascade but let's be explicit)
		if err := tx.Where("team_id = ?", teamID).Delete(&models.Solve{}).Error; err != nil {
			log.Printf("Failed to delete solves for team %d: %v", teamID, err)
			return err
		}

		// Finally delete the team
		result := tx.Delete(&models.Team{}, teamID)
		if result.Error != nil {
			log.Printf("Failed to delete team %d: %v", teamID, result.Error)
			return result.Error
		}

		if result.RowsAffected == 0 {
			log.Printf("Team %d not found during deletion", teamID)
			return errors.New("team not found")
		}

		log.Printf("Successfully deleted team %d and all related records", teamID)
		return nil
	})
}

// LeaveTeam : quitter son équipe
func LeaveTeam(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user_not_found"})
		return
	}
	if user.TeamID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_not_in_team"})
		return
	}

	// Store the team ID before removing the user
	teamID := *user.TeamID

	// Remove user from team
	user.TeamID = nil
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "team_leave_failed"})
		return
	}

	// Check if there are any remaining members in the team
	var remainingMembers int64
	if err := config.DB.Model(&models.User{}).Where("team_id = ?", teamID).Count(&remainingMembers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "team_leave_failed"})
		return
	}

	// If no members remain, delete the team and all related records
	if remainingMembers == 0 {
		if err := deleteTeamCompletely(teamID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "team_leave_failed"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Left team"})
}

// UpdateTeam : non implémenté
func UpdateTeam(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"})
}

// DeleteTeam : non implémenté
func DeleteTeam(c *gin.Context) {
	c.JSON(501, gin.H{"error": "Not implemented"})
}

// TransferTeamOwnership : transfert la propriété d'une équipe à un autre membre
func TransferTeamOwnership(c *gin.Context) {
	var input struct {
		TeamID     uint `json:"teamId" binding:"required"`
		NewOwnerID uint `json:"newOwnerId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "invalid_input"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}
	var team models.Team
	if err := config.DB.First(&team, input.TeamID).Error; err != nil {
		c.JSON(404, gin.H{"error": "team_not_found"})
		return
	}
	if team.CreatorID != userID.(uint) {
		c.JSON(403, gin.H{"error": "not_team_creator"})
		return
	}
	var newOwner models.User
	if err := config.DB.First(&newOwner, input.NewOwnerID).Error; err != nil || newOwner.TeamID == nil || *newOwner.TeamID != team.ID {
		c.JSON(400, gin.H{"error": "new_owner_not_in_team"})
		return
	}
	team.CreatorID = input.NewOwnerID
	if err := config.DB.Save(&team).Error; err != nil {
		c.JSON(500, gin.H{"error": "db_error"})
		return
	}
	c.JSON(200, gin.H{"message": "ownership_transferred"})
}

// DisbandTeam : supprime l'équipe et retire tous les membres
func DisbandTeam(c *gin.Context) {
	var input struct {
		TeamID uint `json:"teamId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "invalid_input"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}
	var team models.Team
	if err := config.DB.First(&team, input.TeamID).Error; err != nil {
		c.JSON(404, gin.H{"error": "team_not_found"})
		return
	}
	if team.CreatorID != userID.(uint) {
		c.JSON(403, gin.H{"error": "not_team_creator"})
		return
	}
	if err := config.DB.Model(&models.User{}).Where("team_id = ?", team.ID).Update("team_id", nil).Error; err != nil {
		c.JSON(500, gin.H{"error": "db_error"})
		return
	}
	if err := deleteTeamCompletely(team.ID); err != nil {
		c.JSON(500, gin.H{"error": "db_error"})
		return
	}
	c.JSON(200, gin.H{"message": "team_disbanded"})
}

// KickTeamMember : kick a member from the team (creator only)
func KickTeamMember(c *gin.Context) {
	var input struct {
		TeamID uint `json:"teamId" binding:"required"`
		UserID uint `json:"userId" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "invalid_input"})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}
	var team models.Team
	if err := config.DB.First(&team, input.TeamID).Error; err != nil {
		c.JSON(404, gin.H{"error": "team_not_found"})
		return
	}
	if team.CreatorID != userID.(uint) {
		c.JSON(403, gin.H{"error": "not_team_creator"})
		return
	}
	if input.UserID == team.CreatorID {
		c.JSON(400, gin.H{"error": "cannot_kick_creator"})
		return
	}
	var member models.User
	if err := config.DB.First(&member, input.UserID).Error; err != nil {
		c.JSON(404, gin.H{"error": "user_not_found"})
		return
	}
	if member.TeamID == nil || *member.TeamID != team.ID {
		c.JSON(400, gin.H{"error": "user_not_in_team"})
		return
	}
	member.TeamID = nil
	if err := config.DB.Save(&member).Error; err != nil {
		c.JSON(500, gin.H{"error": "db_error"})
		return
	}
	c.JSON(200, gin.H{"message": "kicked"})
}

// GetLeaderboard : calculates and returns team rankings with current points
func GetLeaderboard(c *gin.Context) {
	type TeamScore struct {
		Team       models.Team `json:"team"`
		TotalScore int         `json:"totalScore"`
		SolveCount int         `json:"solveCount"`
	}

	var teams []models.Team
	if err := config.DB.Preload("Users").Find(&teams).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_fetch_teams"})
		return
	}

	decayService := utils.NewDecay()
	var leaderboard []TeamScore

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

		leaderboard = append(leaderboard, TeamScore{
			Team:       team,
			TotalScore: totalScore,
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

	c.JSON(http.StatusOK, leaderboard)
}

// RecalculateTeamPoints : recalculates all solve points for all teams based on current challenge values
func RecalculateTeamPoints(c *gin.Context) {
	decayService := utils.NewDecay()

	// Get all solves
	var solves []models.Solve
	if err := config.DB.Find(&solves).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed_to_fetch_solves"})
		return
	}

	updatedCount := 0
	for _, solve := range solves {
		// Get challenge details
		var challenge models.Challenge
		if err := config.DB.First(&challenge, solve.ChallengeID).Error; err != nil {
			continue
		}

		// Calculate the position of this solve (0-based)
		var position int64
		config.DB.Model(&models.Solve{}).
			Where("challenge_id = ? AND created_at < ?", challenge.ID, solve.CreatedAt).
			Count(&position)

		// Calculate new points with current decay settings
		newPoints := decayService.CalculateDecayedPoints(&challenge, int(position))

		// Update if points have changed
		if solve.Points != newPoints {
			solve.Points = newPoints
			if err := config.DB.Save(&solve).Error; err != nil {
				log.Printf("Failed to update solve for team %d, challenge %d: %v", solve.TeamID, solve.ChallengeID, err)
				continue
			}
			updatedCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"message":        "points_recalculated",
		"updated_solves": updatedCount,
	})
}

func GetTeamScore(c *gin.Context) {
	userI, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	user, ok := userI.(*models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "user_wrong_type"})
		return
	}

	if user.TeamID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no_team"})
		return
	}

	// Get team with solves
	var team models.Team
	if err := config.DB.Preload("Solves").First(&team, *user.TeamID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "team_not_found"})
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

	c.JSON(http.StatusOK, gin.H{
		"totalScore":     totalScore,
		"availableScore": totalScore - int(totalSpent),
		"spentOnHints":   int(totalSpent),
	})
}
