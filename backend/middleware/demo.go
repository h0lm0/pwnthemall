package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func DemoRestriction(c *gin.Context) {
	if os.Getenv("PTA_DEMO") == "true" {
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "demo_restriction"})
		return
	}
	c.Next()
}
