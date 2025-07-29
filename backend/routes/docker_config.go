package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterDockerConfigRoutes(router *gin.Engine) {

	// Admin-only endpoints
	configs := router.Group("/docker-config", middleware.AuthRequired(false))
	{
		configs.GET("", middleware.CheckPolicy("/docker-config", "read"), controllers.GetDockerConfig)
		configs.PUT("", middleware.CheckPolicy("/docker-config", "write"), controllers.UpdateDockerConfig)
	}
}
