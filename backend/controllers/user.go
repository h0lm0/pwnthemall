package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/copier"
	"golang.org/x/crypto/bcrypt"
)

// Add this struct for input validation

type UserInput struct {
	Username string `json:"username" binding:"required,max=32"`
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password,omitempty" binding:"omitempty,min=8,max=72"`
	Role     string `json:"role"`
}

func GetUsers(c *gin.Context) {
	var users []models.User
	result := config.DB.Preload("Team").Find(&users)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}
	c.JSON(http.StatusOK, users)
}

func GetUser(c *gin.Context) {
	var user models.User
	id := c.Param("id")

	result := config.DB.First(&user, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, user)
}

func CreateUser(c *gin.Context) {
	var input UserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username (max 32), email (max 254), password (8-72) invalid: " + err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	user := models.User{
		Username: input.Username,
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     input.Role,
	}
	if user.Role == "" {
		user.Role = "member"
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Ne retourne jamais le mot de passe dans la réponse
	c.JSON(http.StatusCreated, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

func UpdateUser(c *gin.Context) {
	var user models.User
	id := c.Param("id")

	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var input UserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username (max 32), email (max 254) or password invalid: " + err.Error()})
		return
	}

	user.Username = input.Username
	user.Email = input.Email
	user.Role = input.Role
	config.DB.Save(&user)

	c.JSON(http.StatusOK, user)
}

func DeleteUser(c *gin.Context) {
	var user models.User
	id := c.Param("id")

	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	config.DB.Delete(&user)
	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

// GetCurrentUser returns the currently authenticated user based on the session
func GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var user models.User
	if err := config.DB.Preload("Team.Creator").Preload("Team").First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var safeMembers []models.SafeUser
	if user.TeamID != nil {
		var members []models.User
		if err := config.DB.Where("team_id = ?", user.TeamID).Find(&members).Error; err == nil {
			safeMembers = make([]models.SafeUser, len(members))
			copier.Copy(&safeMembers, &members)
		}
	}

	response := gin.H{
		"id":          user.ID,
		"username":    user.Username,
		"email":       user.Email,
		"role":        user.Role,
		"banned":      user.Banned,
		"teamId":      user.TeamID,
		"memberSince": user.MemberSince,
		"team":        gin.H{},
	}

	if user.Team != nil {
		response["team"] = gin.H{
			"id":        user.Team.ID,
			"name":      user.Team.Name,
			"creatorId": user.Team.CreatorID,
			"members":   safeMembers,
		}
	}

	c.JSON(http.StatusOK, response)
}

func BanOrUnbanUser(c *gin.Context) {
	var user models.User
	id := c.Param("id")

	if err := config.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	user.Banned = !user.Banned
	config.DB.Save(&user)

	c.JSON(http.StatusOK, gin.H{"banned": user.Banned})
}

// GetUserByIP searches for users by IP address (admin only)
func GetUserByIP(c *gin.Context) {
	ip := c.Query("ip")
	if ip == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "IP address is required"})
		return
	}

	var users []models.User
	// Search for users whose IP addresses contain the specified IP
	// Using JSON_EXTRACT or JSON_SEARCH for MySQL/SQLite compatibility
	result := config.DB.Preload("Team").Where("ip_addresses LIKE ?", "%\""+ip+"\"%").Find(&users)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search users by IP"})
		return
	}

	// Filter results to ensure exact IP match (since LIKE might have false positives)
	var filteredUsers []models.User
	for _, user := range users {
		for _, userIP := range user.IPAddresses {
			if userIP == ip {
				filteredUsers = append(filteredUsers, user)
				break
			}
		}
	}

	c.JSON(http.StatusOK, filteredUsers)
}
