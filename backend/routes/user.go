package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(router *gin.Engine) {
	users := router.Group("/users", middleware.AuthRequired(false))
	{
		users.GET("", middleware.CheckPolicy("/users", "read"), controllers.GetUsers)
		users.GET("/:id", middleware.CheckPolicy("/users/:id", "read"), controllers.GetUser)
		users.POST("", middleware.CheckPolicy("/users", "write"), controllers.CreateUser)
		users.PUT("/:id", middleware.CheckPolicy("/users/:id", "write"), controllers.UpdateUser)
		users.DELETE("/:id", middleware.CheckPolicy("/users/:id", "write"), controllers.DeleteUser)
	}
}
