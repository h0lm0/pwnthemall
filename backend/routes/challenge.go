package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterChallengeRoutes(router *gin.Engine) {
	challenges := router.Group("/challenges")
	{
		challenges.GET("", middleware.AuthRequiredTeamOrAdmin(), middleware.CheckPolicy("/challenges", "read"), controllers.GetChallenges)
		challenges.GET("/:id", middleware.AuthRequiredTeamOrAdmin(), middleware.CheckPolicy("/challenges/:id", "read"), controllers.GetChallenge)
		challenges.GET("/:id/solves", middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/:id/solves", "read"), controllers.GetChallengeSolves)
		challenges.GET("/category/:category", middleware.AuthRequiredTeamOrAdmin(), middleware.CheckPolicy("/challenges/category/:category", "read"), controllers.GetChallengesByCategoryName)

		challenges.POST("", middleware.CheckPolicy("/challenges", "write"), controllers.CreateChallenge)
		challenges.POST("/:id/submit", middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/:id/submit", "write"), controllers.SubmitChallenge)
		challenges.POST("/:id/build", middleware.DemoRestriction, middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/:id/build", "write"), controllers.BuildChallengeImage)
		challenges.GET("/:id/instance-status", middleware.DemoRestriction, middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/:id/instance-status", "read"), controllers.GetInstanceStatus)
		challenges.POST("/:id/start", middleware.DemoRestriction, middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/:id/start", "write"), controllers.StartChallengeInstance)
		challenges.POST("/:id/stop", middleware.DemoRestriction, middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/:id/stop", "write"), controllers.StopChallengeInstance)
		challenges.POST("/:id/kill", middleware.DemoRestriction, middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/:id/kill", "write"), controllers.KillChallengeInstance)

		// Admin endpoints preserved
		challenges.GET("/admin/all", middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/admin/all", "read"), controllers.GetAllChallengesAdmin)
		challenges.GET("/admin/:id", middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/admin/:id", "read"), controllers.GetChallengeAdmin)
		challenges.PUT("/admin/:id", middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/admin/:id", "write"), controllers.UpdateChallengeAdmin)
		challenges.DELETE("/admin/hints/:hintId", middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/admin/hints/:hintId", "write"), controllers.DeleteHint)
	}
}
