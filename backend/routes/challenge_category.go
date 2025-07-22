package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterChallengeCategoryRoutes(router *gin.Engine) {
	challenges := router.Group("/challenge-categories", middleware.AuthRequired(false))
	{
		challenges.GET("", middleware.CheckPolicy("/challenges-categories", "read"), controllers.GetChallengeCategories)
		challenges.GET("/:id", middleware.CheckPolicy("/challenges-categories/:id", "read"), controllers.GetChallengeCategory)
		challenges.POST("", middleware.CheckPolicy("/challenge-categories", "write"), controllers.CreateChallengeCategory)
		challenges.PUT("/:id", middleware.CheckPolicy("/challenge-categories/:id", "write"), controllers.UpdateChallengeCategory)
		challenges.DELETE("/:id", middleware.CheckPolicy("/challenge-categories/:id", "write"), controllers.DeleteChallengeCategory)
	}
}
