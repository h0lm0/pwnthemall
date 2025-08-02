package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterInstanceRoutes(router *gin.Engine) {
	// User routes (authenticated users)
	user := router.Group("/user/instances")
	user.Use(middleware.AuthRequired(false))
	{
		user.GET("", controllers.GetUserInstances)      // User's own instances
		user.GET("/:id", controllers.GetUserInstance)   // User's own instance
		user.GET("/team", controllers.GetTeamInstances) // Team instances
	}

	// Admin routes (admin only)
	admin := router.Group("/admin/instances")
	admin.Use(middleware.AuthRequired(false), middleware.AdminRequired())
	{
		admin.GET("", controllers.GetAdminInstances)    // All instances (full data)
		admin.GET("/:id", controllers.GetAdminInstance) // Single instance (full data)
	}
}
