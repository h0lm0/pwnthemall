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
		auth.POST("refresh", controllers.Refresh)
		auth.POST("register", controllers.Register)
		auth.POST("logout", middleware.AuthRequired(false), controllers.Logout)
		auth.GET("me", middleware.AuthRequired(false), controllers.GetCurrentUser)
		auth.PATCH("me", middleware.AuthRequired(false), controllers.UpdateCurrentUser)
		auth.PUT("me/password", middleware.AuthRequired(false), controllers.UpdateCurrentUserPassword)
		auth.DELETE("me", middleware.AuthRequired(false), controllers.DeleteCurrentUser)
		auth.GET("pwn", middleware.AuthRequired(false), func(c *gin.Context) {
			c.JSON(200, gin.H{"success": "true"})
		})
	}
}
