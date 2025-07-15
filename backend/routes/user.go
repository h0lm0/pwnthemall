package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(router *gin.Engine) {
	users := router.Group("/users", middleware.AuthRequired())
	{
		users.GET("", middleware.CheckPolicy("member", "read"), controllers.GetUsers)
		users.GET("/:id", middleware.CheckPolicy("admin", "read"), controllers.GetUser)
		users.POST("", middleware.CheckPolicy("admin", "write"), controllers.CreateUser)
		users.PUT("/:id", middleware.CheckPolicy("admin", "write"), controllers.UpdateUser)
		users.DELETE("/:id", middleware.CheckPolicy("admin", "write"), controllers.DeleteUser)
	}
}
