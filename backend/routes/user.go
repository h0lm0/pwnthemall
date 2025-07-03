package routes

import (
	"pwnthemall/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterUserRoutes(router *gin.Engine) {
	users := router.Group("/users")
	{
		users.GET("", controllers.GetUsers)
		users.GET("/:id", controllers.GetUser)
		users.POST("", controllers.CreateUser)
		users.PUT("/:id", controllers.UpdateUser)
		users.DELETE("/:id", controllers.DeleteUser)
	}
}
