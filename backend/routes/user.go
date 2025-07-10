package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(router *gin.Engine) {
	users := router.Group("/users")
	{
		users.GET("", middleware.AuthRequired(), controllers.GetUsers)
		users.GET("/:id", middleware.AuthRequired(), controllers.GetUser)
		users.POST("", middleware.AuthRequired(), controllers.CreateUser)
		users.PUT("/:id", middleware.AuthRequired(), controllers.UpdateUser)
		users.DELETE("/:id", middleware.AuthRequired(), controllers.DeleteUser)
	}
}
