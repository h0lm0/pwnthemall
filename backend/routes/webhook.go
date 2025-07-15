package routes

import (
	"pwnthemall/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterWebhookRoutes(router *gin.Engine) {
	auth := router.Group("/webhook")
	{
		auth.POST("minio", controllers.MinioWebhook)
	}
}
