package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/controllers"
	"github.com/pwnthemall/pwnthemall/backend/middleware"
)

func RegisterTeamRoutes(router *gin.Engine) {
	teams := router.Group("/teams", middleware.AuthRequired(false))
	{
		teams.GET("", middleware.CheckPolicy("/teams", "read"), controllers.GetTeams)
		teams.GET("/:id", middleware.CheckPolicy("/teams/:id", "read"), controllers.GetTeam)
		teams.GET("/leaderboard", middleware.CheckPolicy("/teams/leaderboard", "read"), controllers.GetLeaderboard)
		teams.GET("/timeline", middleware.CheckPolicy("/teams/timeline", "read"), controllers.GetTeamTimeline)
		teams.GET("/score", middleware.CheckPolicy("/teams/score", "read"), controllers.GetTeamScore)
		teams.POST("", middleware.CheckPolicy("/teams", "write"), controllers.CreateTeam)
		teams.POST("/join", middleware.CheckPolicy("/teams/join", "write"), middleware.RateLimitJoinTeam(), controllers.JoinTeam)
		teams.POST("/leave", middleware.CheckPolicy("/teams/leave", "write"), controllers.LeaveTeam)
		teams.POST("/transfer-owner", middleware.CheckPolicy("/teams/transfer-owner", "write"), controllers.TransferTeamOwnership)
		teams.POST("/disband", middleware.CheckPolicy("/teams/disband", "write"), controllers.DisbandTeam)
		teams.POST("/kick", middleware.CheckPolicy("/teams/kick", "write"), controllers.KickTeamMember)
		teams.POST("/recalculate-points", middleware.CheckPolicy("/teams/recalculate-points", "write"), controllers.RecalculateTeamPoints)
		teams.PUT("/:id", middleware.CheckPolicy("/teams/:id", "write"), controllers.UpdateTeam)
		teams.DELETE("/:id", middleware.CheckPolicy("/teams/:id", "write"), controllers.DeleteTeam)
	}
}
