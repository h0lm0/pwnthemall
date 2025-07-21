package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if user.TeamID != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already in a team"})
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}
	team := models.Team{
		Name:      input.Name,
		Password:  string(hashedPassword),
		Creator:   user,
		CreatorID: user.ID,
	}
	if err := config.DB.Create(&team).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	user.TeamID = &team.ID
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if user.TeamID != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already in a team"})
		return
	}
	var team models.Team
	if input.TeamID != nil {
		if err := config.DB.First(&team, *input.TeamID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
			return
		}
	} else if input.Name != "" {
		if err := config.DB.Where("name = ?", input.Name).First(&team).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Team not found"})
			return
		}
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "TeamId or Name required"})
		return
	}
	if err := bcrypt.CompareHashAndPassword([]byte(team.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}
	user.TeamID = &team.ID
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	if user.TeamID == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User not in a team"})
		return
	}
	user.TeamID = nil
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
