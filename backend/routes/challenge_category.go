package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterChallengeCategoryRoutes(router *gin.Engine) {
	challenges := router.Group("/challenge-categories", middleware.AuthRequired())
	{
		challenges.GET("", middleware.CheckPolicy("/challenges-categories", "read"), controllers.GetChallengeCategories)
		challenges.GET("/:id", middleware.CheckPolicy("/challenges-categories/:id", "read"), controllers.GetChallengeCategory)
		// challenges.POST("", middleware.CheckPolicy("/challenges", "write"), controllers.CreateUser)
		// challenges.PUT("/:id", middleware.CheckPolicy("/challenges/:id", "write"), controllers.UpdateUser)
		// challenges.DELETE("/:id", middleware.CheckPolicy("/challenges/:id", "write"), controllers.DeleteUser)
	}
}
