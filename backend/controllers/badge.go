package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

type BadgeInput struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
	Type        string `json:"type"`
}

func GetBadges(c *gin.Context) {
	var badges []models.Badge
	result := config.DB.Find(&badges)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, badges)
}

func GetBadge(c *gin.Context) {
	var badge models.Badge
	id := c.Param("id")
	result := config.DB.First(&badge, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Badge not found"})
		return
	}
	c.JSON(http.StatusOK, badge)
}

func GetUserBadges(c *gin.Context) {
	userID := c.Param("id")

	var userBadges []models.UserBadge
	result := config.DB.Preload("Badge").Preload("Challenge").Where("user_id = ?", userID).Find(&userBadges)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, userBadges)
}

func CreateBadge(c *gin.Context) {
	var input BadgeInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	badge := models.Badge{
		Name:        input.Name,
		Description: input.Description,
		Icon:        input.Icon,
		Color:       input.Color,
		Type:        input.Type,
	}

	if err := config.DB.Create(&badge).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, badge)
}

func AwardBadge(userID uint, badgeID uint, challengeID *uint, teamID *uint) error {
	var existingBadge models.UserBadge
	query := config.DB.Where("user_id = ? AND badge_id = ?", userID, badgeID)

	if challengeID != nil {
		query = query.Where("challenge_id = ?", *challengeID)
	}

	if query.First(&existingBadge).Error == nil {
		return nil
	}

	userBadge := models.UserBadge{
		UserID:      userID,
		BadgeID:     badgeID,
		ChallengeID: challengeID,
		TeamID:      teamID,
	}

	return config.DB.Create(&userBadge).Error
}

func CheckAndAwardFirstBlood(userID uint, challengeID uint) {
	var solveCount int64
	config.DB.Model(&models.Solve{}).Where("challenge_id = ?", challengeID).Count(&solveCount)

	if solveCount == 1 {
		var firstbloodBadge models.Badge
		if err := config.DB.Where("type = ? AND name = ?", "firstblood", "First Blood").First(&firstbloodBadge).Error; err == nil {
			AwardBadge(userID, firstbloodBadge.ID, &challengeID, nil)
		}
	}
}
