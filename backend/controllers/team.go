package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// GetTeams : liste toutes les équipes
func GetTeams(c *gin.Context) {
	var teams []models.Team
	if err := config.DB.Find(&teams).Error; err != nil {
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
	c.JSON(http.StatusOK, gin.H{"team": team, "members": members})
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
	user.TeamID = nil
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "team_leave_failed"})
		return
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
	if err := config.DB.Delete(&team).Error; err != nil {
		c.JSON(500, gin.H{"error": "db_error"})
		return
	}
	c.JSON(200, gin.H{"message": "team_disbanded"})
}
