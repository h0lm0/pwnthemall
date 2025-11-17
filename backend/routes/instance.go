package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/controllers"
	"github.com/pwnthemall/pwnthemall/backend/middleware"
)

func RegisterInstanceRoutes(router *gin.Engine) {
	challenges := router.Group("/instances", middleware.DemoRestriction)
	{
		challenges.GET("", middleware.AuthRequiredTeamOrAdmin(), middleware.CheckPolicy("/instances", "read"), controllers.GetInstances)
		challenges.GET("/:id", middleware.AuthRequiredTeamOrAdmin(), middleware.CheckPolicy("/instances/:id", "read"), controllers.GetInstance)
	}
}
