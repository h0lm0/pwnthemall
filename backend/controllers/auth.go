package controllers

import (
	"pwnthemall/config"
	"pwnthemall/dto"
	"pwnthemall/models"
	"pwnthemall/utils"
	"strconv"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jinzhu/copier"
	"golang.org/x/crypto/bcrypt"
)

// Register creates a new user account
func Register(c *gin.Context) {
	// Check if registration is enabled
	var registrationConfig models.Config
	if err := config.DB.Where("key = ?", "REGISTRATION_ENABLED").First(&registrationConfig).Error; err != nil {
		// If config doesn't exist, default to enabled
		if err.Error() == "record not found" {
			// Continue with registration
		} else {
			utils.InternalServerError(c, "Failed to check registration status")
			return
		}
	} else {
		// Check if registration is disabled
		if registrationConfig.Value == "false" || registrationConfig.Value == "0" {
			utils.ForbiddenError(c, "Registration is currently disabled")
			return
		}
	}

	var input dto.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		// Custom error handling for validation errors
		if ve, ok := err.(validator.ValidationErrors); ok {
			for _, fe := range ve {
				switch fe.Field() {
				case "Username":
					utils.BadRequestError(c, "Username too long (max 32 characters)")
					return
				case "Email":
					utils.BadRequestError(c, "Email too long (max 254 characters) or invalid email")
					return
				case "Password":
					utils.BadRequestError(c, "Password must be 8-72 characters")
					return
				}
			}
		}
		utils.BadRequestError(c, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerError(c, "Erreur lors du hash du mot de passe")
		return
	}

	var user models.User
	copier.Copy(&user, &input)
	user.Password = string(hashedPassword)
	user.Role = "member"

	if err := config.DB.Create(&user).Error; err != nil {
		// Check if it's a unique constraint violation
		if strings.Contains(err.Error(), "duplicate key") || strings.Contains(err.Error(), "UNIQUE constraint failed") {
			if strings.Contains(err.Error(), "users_username_key") || strings.Contains(err.Error(), "username") {
				utils.ConflictError(c, "Username already exists")
				return
			}
			if strings.Contains(err.Error(), "users_email_key") || strings.Contains(err.Error(), "email") {
				utils.ConflictError(c, "Email already exists")
				return
			}
			// Generic duplicate error
			utils.ConflictError(c, "User already exists")
			return
		}
		// Other database errors
		utils.InternalServerError(c, "Failed to create user")
		return
	}

	utils.CreatedResponse(c, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

// Login authenticates a user using username or email and sets a session cookie
func Login(c *gin.Context) {
	var input dto.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequestError(c, "invalid_input")
		return
	}

	usernameOrEmail := strings.TrimSpace(input.Username)

	if usernameOrEmail == "" || strings.TrimSpace(input.Password) == "" {
		utils.BadRequestError(c, "please_fill_fields")
		return
	}

	var user models.User
	if err := config.DB.Where("username = ? OR email = ?", usernameOrEmail, usernameOrEmail).First(&user).Error; err != nil {
		utils.UnauthorizedError(c, "invalid_credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		utils.UnauthorizedError(c, "invalid_credentials")
		return
	}

	if user.Banned {
		utils.ErrorResponse(c, 418, "banned") // 418 I'm a teapot
		return
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		utils.InternalServerError(c, "could not create access token")
		return
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID)
	if err != nil {
		utils.InternalServerError(c, "could not create refresh token")
		return
	}

	// Set both tokens as secure HTTP-only cookies
	c.SetCookie("access_token", accessToken, 3600, "/", "", true, true)        // 1 hour, secure, httpOnly
	c.SetCookie("refresh_token", refreshToken, 7*24*3600, "/", "", true, true) // 7 days, secure, httpOnly

	utils.OKResponse(c, gin.H{"message": "Login successful"})
}

func Refresh(c *gin.Context) {
	tokenStr, err := c.Cookie("refresh_token")
	if err != nil {
		utils.UnauthorizedError(c, "missing refresh token")
		return
	}

	token, err := jwt.ParseWithClaims(tokenStr, &jwt.RegisteredClaims{}, func(t *jwt.Token) (interface{}, error) {
		return utils.RefreshSecret, nil
	})
	if err != nil || !token.Valid {
		utils.UnauthorizedError(c, "invalid refresh token")
		return
	}

	claims := token.Claims.(*jwt.RegisteredClaims)
	userID, err := strconv.Atoi(claims.Subject)
	if err != nil {
		utils.InternalServerError(c, "can't read subject")
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.UnauthorizedError(c, "user not found")
		return
	}

	accessToken, err := utils.GenerateAccessToken(user.ID, user.Role)
	if err != nil {
		utils.InternalServerError(c, "failed to generate access token")
		return
	}

	// Set the new access token as a secure HTTP-only cookie
	c.SetCookie("access_token", accessToken, 3600, "/", "", true, true) // 1 hour, secure, httpOnly

	utils.OKResponse(c, gin.H{"message": "Token refreshed"})
}

// Logout clears the user session
func Logout(c *gin.Context) {
	// Clear the session
	session := sessions.Default(c)
	session.Clear()
	session.Options(sessions.Options{Path: "/", MaxAge: -1})
	session.Save()

	// Clear both JWT cookies
	c.SetCookie("access_token", "", -1, "/", "", true, true)
	c.SetCookie("refresh_token", "", -1, "/", "", true, true)

	utils.OKResponse(c, gin.H{"message": "logged out"})
}

// Update current user's username
func UpdateCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.UnauthorizedError(c, "unauthorized")
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.NotFoundError(c, "User not found")
		return
	}

	var input struct {
		Username string `json:"username" binding:"max=32"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequestError(c, "Username too long (max 32 chars) or invalid input")
		return
	}

	if input.Username == "" {
		utils.BadRequestError(c, "Username cannot be empty")
		return
	}

	user.Username = input.Username
	if err := config.DB.Save(&user).Error; err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}
	utils.OKResponse(c, gin.H{
		"message":  "Username updated",
		"username": user.Username,
	})
}

// Update current user's password
func UpdateCurrentUserPassword(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.UnauthorizedError(c, "unauthorized")
		return
	}

	var input struct {
		Current string `json:"current"`
		New     string `json:"new" binding:"min=8,max=72"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.BadRequestError(c, "Password must be 8-72 characters.")
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.NotFoundError(c, "User not found")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Current)); err != nil {
		utils.UnauthorizedError(c, "Current password is incorrect")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.New), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerError(c, "Failed to hash new password")
		return
	}

	user.Password = string(hashedPassword)
	if err := config.DB.Save(&user).Error; err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}
	utils.OKResponse(c, gin.H{"message": "Password updated"})
}

// Delete current user
func DeleteCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.UnauthorizedError(c, "unauthorized")
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		utils.NotFoundError(c, "User not found")
		return
	}

	if err := config.DB.Delete(&user).Error; err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}
	utils.OKResponse(c, gin.H{"message": "User deleted"})
}
