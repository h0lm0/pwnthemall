package middleware

import (
	"fmt"
	"net/http"
	"pwnthemall/config"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// AuthRequired ensures a user is logged in
func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		userID := session.Get("user_id")
		if userID == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		c.Set("user_id", userID)
		c.Next()
	}
}

func CheckPolicy(obj string, act string) gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		sub := session.Get("user_role")
		if sub == nil {
			sub = "anonymous"
		}

		err := config.CEF.LoadPolicy()
		if err != nil {
			c.AbortWithStatusJSON(500, gin.H{"error": "Internal server error"})
			return
		}

		// Casbin enforces policy
		ok, err := config.CEF.Enforce(fmt.Sprint(sub), obj, act)

		if err != nil {
			c.AbortWithStatusJSON(500, gin.H{"error": "Error occurred when authorizing"})
			return
		}

		if !ok {
			c.AbortWithStatusJSON(403, gin.H{"error": "Unauthorized"})
			return
		}
		c.Next()
	}
}
