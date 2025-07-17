package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

func GetChallenges(c *gin.Context) {
	var challenges []models.Challenge
	result := config.DB.Find(&challenges)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, challenges)
}

func GetChallenge(c *gin.Context) {
	var challenge models.Challenge
	id := c.Param("id")

	result := config.DB.First(&challenge, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Challenge not found"})
		return
	}
	c.JSON(http.StatusOK, challenge)
}

// func CreateChallenge(c *gin.Context) {
// 	var input RegisterInput
// 	if err := c.ShouldBindJSON(&input); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}

// 	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du hash du mot de passe"})
// 		return
// 	}

// 	user := models.User{
// 		Username: input.Username,
// 		Email:    input.Email,
// 		Password: string(hashedPassword),
// 	}

// 	if err := config.DB.Create(&user).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
// 		return
// 	}

// 	// Ne retourne jamais le mot de passe dans la réponse
// 	c.JSON(http.StatusCreated, gin.H{
// 		"id":       user.ID,
// 		"username": user.Username,
// 		"email":    user.Email,
// 	})
// }

// func UpdateChallenge(c *gin.Context) {
// 	var user models.User
// 	id := c.Param("id")

// 	if err := config.DB.First(&user, id).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
// 		return
// 	}

// 	var input models.User
// 	if err := c.ShouldBindJSON(&input); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
// 		return
// 	}

// 	user.Username = input.Username
// 	user.Email = input.Email
// 	config.DB.Save(&user)

// 	c.JSON(http.StatusOK, user)
// }

// func DeleteChallenge(c *gin.Context) {
// 	var user models.User
// 	id := c.Param("id")

// 	if err := config.DB.First(&user, id).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
// 		return
// 	}

// 	config.DB.Delete(&user)
// 	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
// }
