package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterTeamRoutes(router *gin.Engine) {
	teams := router.Group("/teams", middleware.AuthRequired(false))
	{
		teams.GET("", middleware.CheckPolicy("/teams", "read"), controllers.GetTeams)
		teams.GET("/:id", middleware.CheckPolicy("/teams/:id", "read"), controllers.GetTeam)
		teams.GET("/leaderboard", middleware.CheckPolicy("/teams", "read"), controllers.GetLeaderboard)
		teams.POST("", middleware.CheckPolicy("/teams", "write"), controllers.CreateTeam)
		teams.POST("/join", middleware.CheckPolicy("/teams", "write"), controllers.JoinTeam)
		teams.POST("/leave", middleware.CheckPolicy("/teams", "write"), controllers.LeaveTeam)
		teams.POST("/transfer-owner", middleware.CheckPolicy("/teams", "write"), controllers.TransferTeamOwnership)
		teams.POST("/disband", middleware.CheckPolicy("/teams", "write"), controllers.DisbandTeam)
		teams.POST("/kick", middleware.CheckPolicy("/teams", "write"), controllers.KickTeamMember)
		teams.POST("/recalculate-points", middleware.CheckPolicy("/teams", "write"), controllers.RecalculateTeamPoints)
		teams.PUT("/:id", middleware.CheckPolicy("/teams/:id", "write"), controllers.UpdateTeam)
		teams.DELETE("/:id", middleware.CheckPolicy("/teams/:id", "write"), controllers.DeleteTeam)
	}
}
