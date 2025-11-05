package utils

import (
	"pwnthemall/models"

	"github.com/gin-gonic/gin"
)

// GetAuthenticatedUser retrieves the authenticated user from the Gin context
// Returns the user and a boolean indicating if the user was found
func GetAuthenticatedUser(c *gin.Context) (*models.User, bool) {
	user, exists := c.Get("user")
	if !exists {
		return nil, false
	}

	authenticatedUser, ok := user.(*models.User)
	if !ok {
		return nil, false
	}

	return authenticatedUser, true
}

// GetAuthenticatedUserID retrieves the authenticated user ID from the Gin context
// Returns the user ID and a boolean indicating if the ID was found
func GetAuthenticatedUserID(c *gin.Context) (uint, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	id, ok := userID.(uint)
	if !ok {
		return 0, false
	}

	return id, true
}
