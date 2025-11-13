package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterSubmissionRoutes(router *gin.Engine) {
	adminSubmissions := router.Group("/admin/submissions", middleware.AuthRequired(false))
	{
		adminSubmissions.GET("", middleware.CheckPolicy("/admin/submissions", "read"), controllers.GetAllSubmissions)
	}
}
