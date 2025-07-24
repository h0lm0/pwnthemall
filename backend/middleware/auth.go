package middleware

import (
	"fmt"
	"log"
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"
	"pwnthemall/utils"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AuthRequired ensures a user is logged in
func SessionAuthRequired(needTeam bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		session := sessions.Default(c)
		userID := session.Get("user_id")
		if userID == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		// Vérifie que l'utilisateur existe encore en BDD
		var user models.User
		if err := config.DB.Preload("Team").First(&user, userID).Error; err != nil {
			session.Clear()
			session.Save()
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		if user.Banned {
			session.Clear()
			session.Save()
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "banned"})
			return
		}

		if needTeam {
			if user.TeamID == nil || user.Team == nil {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "team required"})
				return
			}
		}

		c.Set("user_id", userID)
		c.Set("user", &user)
		c.Next()
	}
}

func getClaimsFromHeader(authHeader string) (*utils.TokenClaims, string) {
	if authHeader == "" || len(authHeader) < 8 || authHeader[:7] != "Bearer " {
		return nil, "missing or invalid authorization header"
	}

	tokenStr := authHeader[7:]
	token, err := jwt.ParseWithClaims(tokenStr, &utils.TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		return utils.AccessSecret, nil
	})
	if err != nil || !token.Valid {
		return nil, "invalid token"
	}

	return token.Claims.(*utils.TokenClaims), ""
}

func CheckPolicy(obj string, act string) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, errMsg := getClaimsFromHeader(c.GetHeader("Authorization"))
		if claims == nil {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": errMsg})
			return
		}

		sub := fmt.Sprint(claims.Role)
		if sub == "" {
			sub = "anonymous"
		}

		// Vérification Casbin
		err := config.CEF.LoadPolicy()

		if err != nil {

			c.AbortWithStatusJSON(500, gin.H{"error": "Internal server error"})

			return

		}
		ok, err := config.CEF.Enforce(sub, obj, act)
		if err != nil {
			log.Printf("Casbin error: %v", err)
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "authorization error"})
			return
		}

		if !ok {
			log.Printf("Unauthorized action: sub:%s act:%s obj:%s", sub, act, obj)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "unauthorized: wrong permissions"})
			return
		}

		c.Next()
	}
}

func AuthRequired(needTeam bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, err := getClaimsFromHeader(c.GetHeader("Authorization"))
		if claims == nil {
			c.AbortWithStatusJSON(403, gin.H{"error": err})
			return
		}
		var user models.User
		if err := config.DB.Preload("Team").First(&user, claims.UserID).Error; err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
			return
		}

		if user.Banned {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "banned"})
			return
		}

		if needTeam && (user.TeamID == nil || user.Team == nil) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "team required"})
			return
		}

		c.Set("user_id", user.ID)
		c.Set("user", &user)
		c.Next()
	}
}
