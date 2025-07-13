package middleware

import (
	"fmt"
	"net/http"

	"github.com/casbin/casbin/v2"
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

func CheckPolicy(obj string, act string, enforcer *casbin.Enforcer) gin.HandlerFunc {
	return func(c *gin.Context) {
		sub, existed := c.Get("user_id")
		if !existed {
			c.AbortWithStatusJSON(401, gin.H{"msg": "User hasn't logged in yet"})
			return
		}

		err := enforcer.LoadPolicy()
		if err != nil {
			c.AbortWithStatusJSON(500, gin.H{"msg": "Failed to load policy from DB"})
			return
		}

		// Casbin enforces policy
		ok, err := enforcer.Enforce(fmt.Sprint(sub), obj, act)

		if err != nil {
			c.AbortWithStatusJSON(500, gin.H{"msg": "Error occurred when authorizing user"})
			return
		}

		if !ok {
			c.AbortWithStatusJSON(403, gin.H{"msg": "You are not authorized"})
			return
		}
		c.Next()
	}
}
