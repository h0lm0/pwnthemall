package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterChallengeRoutes(router *gin.Engine) {
	challenges := router.Group("/challenges", middleware.AuthRequired(true))
	{
		challenges.GET("", middleware.CheckPolicy("/challenges", "read"), controllers.GetChallenges)
		challenges.GET("/:id", middleware.CheckPolicy("/challenges/:id", "read"), controllers.GetChallenge)
		challenges.GET("/category/:category", middleware.CheckPolicy("/challenges/category/:category", "read"), controllers.GetChallengesByCategoryName)

		challenges.POST("", middleware.CheckPolicy("/challenges", "write"), controllers.CreateChallenge)
		challenges.POST("/:id/submit", middleware.CheckPolicy("/challenges/:id/submit", "write"), controllers.SubmitChallenge)
		challenges.POST("/:id/build", middleware.CheckPolicy("/challenges/:id/build", "write"), controllers.BuildChallengeImage)
		// challenges.PUT("/:id", middleware.CheckPolicy("/challenges/:id", "write"), controllers.UpdateUser)
		// challenges.DELETE("/:id", middleware.CheckPolicy("/challenges/:id", "write"), controllers.DeleteUser)
	}
}
