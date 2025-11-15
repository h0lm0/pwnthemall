package routes

import (
	"pwnthemall/controllers"
	"pwnthemall/middleware"

	"github.com/gin-gonic/gin"
)

func RegisterPluginRoutes(router *gin.Engine) {
	plugins := router.Group("/plugins", middleware.AuthRequired(false))
	{
		plugins.GET("", middleware.AuthRequired(false), middleware.CheckPolicy("/plugins", "read"), controllers.GetLoadedPlugins)
	}
}
