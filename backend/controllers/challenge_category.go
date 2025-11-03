package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

type ChallengeCategoryInput struct {
	Name string `json:"name" binding:"required"`
}

func GetChallengeCategories(c *gin.Context) {
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

	if !config.IsCTFStarted() && user.Role != "admin" {
		c.JSON(http.StatusOK, []interface{}{}) 
		return
	}

	var challengeCategories []models.ChallengeCategory
	result := config.DB.Find(&challengeCategories)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, challengeCategories)
}

func GetChallengeCategory(c *gin.Context) {
	var challengeCategory models.ChallengeCategory
	id := c.Param("id")

	result := config.DB.First(&challengeCategory, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge category not found"})
		return
	}
	c.JSON(http.StatusOK, challengeCategory)
}

func CreateChallengeCategory(c *gin.Context) {
	var input ChallengeCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	challengeCategory := models.ChallengeCategory{
		Name: input.Name,
	}
	if err := config.DB.Create(&challengeCategory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":   challengeCategory.ID,
		"name": challengeCategory.Name,
	})

}

func UpdateChallengeCategory(c *gin.Context) {
	var challengeCategory models.ChallengeCategory
	id := c.Param("id")

	if err := config.DB.First(&challengeCategory, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge category not found"})
		return
	}

	var input models.ChallengeCategory
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	challengeCategory.Name = input.Name
	config.DB.Save(&challengeCategory)

	c.JSON(http.StatusOK, challengeCategory)
}

func DeleteChallengeCategory(c *gin.Context) {
	var challengeCategory models.ChallengeCategory
	id := c.Param("id")

	if err := config.DB.First(&challengeCategory, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge category not found"})
		return
	}

	config.DB.Delete(&challengeCategory)
	c.JSON(http.StatusOK, gin.H{"message": "Challenge category deleted"})
}

type ReorderChallengesRequest struct {
	ChallengeIds []uint `json:"challengeIds" binding:"required"`
}

func ReorderChallenges(c *gin.Context) {
	categoryId := c.Param("id")

	var category models.ChallengeCategory
	if err := config.DB.First(&category, categoryId).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge category not found"})
		return
	}

	var req ReorderChallengesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	for index, challengeId := range req.ChallengeIds {
		var challenge models.Challenge
		if err := config.DB.First(&challenge, challengeId).Error; err != nil {
			continue 
		}

	
		if challenge.ChallengeCategoryID != category.ID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Challenge does not belong to this category"})
			return
		}

		challenge.Order = index
		if err := config.DB.Save(&challenge).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update challenge order"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Challenges reordered successfully"})
}
