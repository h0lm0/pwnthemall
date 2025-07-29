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
		challenges.POST("/:id/build", middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/:id/build", "write"), controllers.BuildChallengeImage)
		challenges.POST("/:id/start", middleware.AuthRequired(true), middleware.CheckPolicy("/challenges/:id/start", "write"), controllers.StartChallengeInstance)
		// challenges.PUT("/:id", middleware.CheckPolicy("/challenges/:id", "write"), controllers.UpdateUser)
		// challenges.DELETE("/:id", middleware.CheckPolicy("/challenges/:id", "write"), controllers.DeleteUser)
	}
}
