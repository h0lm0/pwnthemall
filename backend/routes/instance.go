package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterInstanceRoutes(router *gin.Engine) {
	challenges := router.Group("/instances")
	{
		challenges.GET("", middleware.AuthRequiredTeamOrAdmin(), middleware.CheckPolicy("/instances", "read"), controllers.GetInstances)
		challenges.GET("/:id", middleware.AuthRequiredTeamOrAdmin(), middleware.CheckPolicy("/instances/:id", "read"), controllers.GetInstance)
	}
}
