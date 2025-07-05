package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterAuthRoutes(router *gin.Engine) {
	auth := router.Group("/")
	{
		auth.POST("login", controllers.Login)
		auth.POST("register", controllers.Register)
		auth.POST("logout", middleware.AuthRequired(), controllers.Logout)
		auth.GET("pwn", middleware.AuthRequired(), func(c *gin.Context) {
			c.JSON(200, gin.H{"message": "pwned"})
		})
	}
}
