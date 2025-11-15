package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterDashboardRoutes(router *gin.Engine) {
	// Admin-only dashboard endpoints
	dashboard := router.Group("/admin/dashboard", middleware.AuthRequired(false))
	{
		dashboard.GET("/stats", middleware.CheckPolicy("/admin/dashboard", "read"), controllers.GetDashboardStats)
		dashboard.GET("/submission-trend", middleware.CheckPolicy("/admin/dashboard", "read"), controllers.GetSubmissionTrend)
	}
}
