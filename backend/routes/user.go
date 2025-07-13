package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(router *gin.Engine) {
	users := router.Group("/users", middleware.AuthRequired())
	{
		users.GET("", middleware.CheckPolicy("user", "read"), controllers.GetUsers)
		users.GET("/:id", middleware.CheckPolicy("user", "read"), controllers.GetUser)
		users.POST("", middleware.CheckPolicy("user", "write"), controllers.CreateUser)
		users.PUT("/:id", middleware.CheckPolicy("user", "write"), controllers.UpdateUser)
		users.DELETE("/:id", middleware.CheckPolicy("user", "write"), controllers.DeleteUser)
	}
}
