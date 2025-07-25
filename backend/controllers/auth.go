package controllers

import (
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"
	"pwnthemall/utils"
	"strconv"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type RegisterInput struct {
	Username string `json:"username" binding:"required,max=32"`
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password" binding:"required,min=8,max=72"`
	Role     string `json:"role"`
}

type LoginInput struct {
	Identifier string `json:"identifier" binding:"required"`
	Password   string `json:"password" binding:"required"`
}

// Register creates a new user account
func Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		// Custom error handling for validation errors
		if ve, ok := err.(validator.ValidationErrors); ok {
			for _, fe := range ve {
				switch fe.Field() {
				case "Username":
					c.JSON(http.StatusBadRequest, gin.H{"error": "Username too long (max 32 characters)"})
					return
				case "Email":
					c.JSON(http.StatusBadRequest, gin.H{"error": "Email too long (max 254 characters) or invalid email"})
					return
				case "Password":
					c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be 8-72 characters"})
					return
				}
			}
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Erreur lors du hash du mot de passe"})
		return
	}

	user := models.User{
		Username: input.Username,
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     "member",
		// Uuid:     uuid.NewString(),
	}

	if err := config.DB.Create(&user).Error; err != nil {
		// Check if it's a unique constraint violation
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "UNIQUE constraint failed") {
			if strings.Contains(err.Error(), "users_username_key") || strings.Contains(err.Error(), "username") {
				c.JSON(http.StatusConflict, gin.H{"error": "Username already exists"})
				return
			}
			if strings.Contains(err.Error(), "users_email_key") || strings.Contains(err.Error(), "email") {
				c.JSON(http.StatusConflict, gin.H{"error": "Email already exists"})
				return
			}
			// Generic duplicate error
			c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
			return
		}
		// Other database errors
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

// Login authenticates a user using username or email and sets a session cookie
func Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("username = ? OR email = ?", input.Identifier, input.Identifier).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid_credentials"})
		return
	}

	if user.Banned {
		c.JSON(http.StatusTeapot, gin.H{"error": "banned"})
		return
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create access token"})
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not create refresh token"})
		return
	}
	// pas de secure mais httponly
	c.SetCookie("refresh_token", refreshToken, 7*24*3600, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"access_token": accessToken})
}

func Refresh(c *gin.Context) {
	tokenStr, err := c.Cookie("refresh_token")
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing refresh token"})
		return
	}

	token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
		return utils.RefreshSecret, nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
		return
	}

	claims := token.Claims.(*jwt.RegisteredClaims)
	userID, err := strconv.Atoi(claims.Subject)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "can't read subject"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate access token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"access_token": accessToken})
}

// Logout clears the user session
func Logout(c *gin.Context) {
	// Clear the session
	session := sessions.Default(c)
	session.Clear()
	session.Options(sessions.Options{Path: "/", MaxAge: -1})
	session.Save()

	// Clear the refresh token cookie
	c.SetCookie("refresh_token", "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

// Update current user's username
func UpdateCurrentUser(c *gin.Context) {
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

	var input struct {
		Username string `json:"username" binding:"max=32"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username too long (max 32 chars) or invalid input"})
		return
	}

	if input.Username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username cannot be empty"})
		return
	}

	user.Username = input.Username
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Username updated"})
}

// Update current user's password
func UpdateCurrentUserPassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var input struct {
		Current string `json:"current"`
		New     string `json:"new" binding:"min=8,max=72"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be 8-72 characters."})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Current)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Current password is incorrect"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.New), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash new password"})
		return
	}

	user.Password = string(hashedPassword)
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password updated"})
}

// Delete current user
func DeleteCurrentUser(c *gin.Context) {
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

	if err := config.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}
