package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/controllers"
	"github.com/pwnthemall/pwnthemall/backend/middleware"
)

const adminInstancesPath = "/admin/instances"

func RegisterInstanceRoutes(router *gin.Engine) {
	// Admin routes for managing all instances
	adminInstances := router.Group(adminInstancesPath)
	{
		adminInstances.GET("", middleware.AuthRequired(false), middleware.CheckPolicy(adminInstancesPath, "read"), controllers.GetAllInstancesAdmin)
		adminInstances.DELETE("/:id", middleware.DemoRestriction, middleware.AuthRequired(false), middleware.CheckPolicy(adminInstancesPath, "delete"), controllers.DeleteInstanceAdmin)
		adminInstances.DELETE("", middleware.DemoRestriction, middleware.AuthRequired(false), middleware.CheckPolicy(adminInstancesPath, "delete"), controllers.StopAllInstancesAdmin)
	}

	// User routes for managing their own instances
	challenges := router.Group("/instances", middleware.DemoRestriction)
	{
		challenges.GET("", middleware.AuthRequiredTeamOrAdmin(), middleware.CheckPolicy("/instances", "read"), controllers.GetInstances)
		challenges.GET("/:id", middleware.AuthRequiredTeamOrAdmin(), middleware.CheckPolicy("/instances/:id", "read"), controllers.GetInstance)
	}
}
