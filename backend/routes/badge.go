package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterBadgeRoutes(router *gin.Engine) {
	badges := router.Group("/badges", middleware.AuthRequired(false))
	{
		badges.GET("", middleware.CheckPolicy("/badges", "read"), controllers.GetBadges)
		badges.GET("/:id", middleware.CheckPolicy("/badges/:id", "read"), controllers.GetBadge)
		badges.POST("", middleware.CheckPolicy("/badges", "write"), controllers.CreateBadge)
	}

	// User badge routes
	users := router.Group("/users", middleware.AuthRequired(false))
	{
		users.GET("/:id/badges", middleware.CheckPolicy("/users/:id/badges", "read"), controllers.GetUserBadges)
	}
}
