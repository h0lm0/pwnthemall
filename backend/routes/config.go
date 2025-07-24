package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterConfigRoutes(router *gin.Engine) {
	configs := router.Group("/configs", middleware.AuthRequired(true))
	{
		configs.GET("", middleware.CheckPolicy("/configs", "read"), controllers.GetConfigs)
	}
}
