package controllers

import (
	"net/http"
	config "pwnthemall/config"
	models "pwnthemall/models"

	"github.com/gin-gonic/gin"
)

func GetConfigs(c *gin.Context) {
	var configs []models.Config
	result := config.DB.Find(&configs)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, configs)
}

// func GetUser(c *gin.Context) {
// 	var user models.User
// 	id := c.Param("id")

// 	result := config.DB.First(&user, id)
// 	if result.Error != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
// 		return
// 	}
// 	c.JSON(http.StatusOK, user)
// }

// func CreateUser(c *gin.Context) {
// 	var input UserInput
// 	if err := c.ShouldBindJSON(&input); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Username (max 32), email (max 254), password (8-72) invalid: " + err.Error()})
// 		return
// 	}

// 	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
// 		return
// 	}

// 	user := models.User{
// 		Username: input.Username,
// 		Email:    input.Email,
// 		Password: string(hashedPassword),
// 		Role:     input.Role,
// 	}
// 	if user.Role == "" {
// 		user.Role = "member"
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

// func UpdateUser(c *gin.Context) {
// 	var user models.User
// 	id := c.Param("id")

// 	if err := config.DB.First(&user, id).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
// 		return
// 	}

// 	var input UserInput
// 	if err := c.ShouldBindJSON(&input); err != nil {
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "Username (max 32), email (max 254) or password invalid: " + err.Error()})
// 		return
// 	}

// 	user.Username = input.Username
// 	user.Email = input.Email
// 	user.Role = input.Role
// 	config.DB.Save(&user)

// 	c.JSON(http.StatusOK, user)
// }

// func DeleteUser(c *gin.Context) {
// 	var user models.User
// 	id := c.Param("id")

// 	if err := config.DB.First(&user, id).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
// 		return
// 	}

// 	config.DB.Delete(&user)
// 	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
// }
