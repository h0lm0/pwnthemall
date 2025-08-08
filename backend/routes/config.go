package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterConfigRoutes(router *gin.Engine) {
	// Public endpoint for public configurations
	router.GET("/public-configs", controllers.GetPublicConfigs)

	// Public endpoint for CTF status
	router.GET("/ctf-status", controllers.GetCTFStatus)

	// Admin-only endpoints
	configs := router.Group("/configs", middleware.AuthRequired(false))
	{
		configs.GET("", middleware.CheckPolicy("/configs", "read"), controllers.GetConfigs)
		configs.GET("/:key", middleware.DemoRestriction, middleware.CheckPolicy("/configs/:key", "read"), controllers.GetConfig)
		configs.POST("", middleware.DemoRestriction, middleware.CheckPolicy("/configs", "write"), controllers.CreateConfig)
		configs.PUT("/:key", middleware.DemoRestriction, middleware.CheckPolicy("/configs/:key", "write"), controllers.UpdateConfig)
		configs.DELETE("/:key", middleware.DemoRestriction, middleware.CheckPolicy("/configs/:key", "write"), controllers.DeleteConfig)
	}
}
