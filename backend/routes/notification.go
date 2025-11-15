package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/controllers"
	"github.com/pwnthemall/pwnthemall/backend/middleware"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

func RegisterNotificationRoutes(router *gin.Engine) {
	// WebSocket endpoint for real-time notifications
	router.GET("/ws/notifications", middleware.AuthRequired(false), func(c *gin.Context) {
		userID := c.GetUint("user_id")
		utils.ServeWs(controllers.WebSocketHub, userID, c.Writer, c.Request)
	})

	// User notification endpoints
	notifications := router.Group("/notifications", middleware.AuthRequired(false))
	{
		notifications.GET("", controllers.GetUserNotifications)
		notifications.GET("/unread-count", controllers.GetUnreadCount)
		notifications.PUT("/:id/read", controllers.MarkNotificationAsRead)
		notifications.PUT("/read-all", controllers.MarkAllNotificationsAsRead)
	}

	// Admin notification endpoints
	adminNotifications := router.Group("/admin/notifications", middleware.AuthRequired(false))
	{
		adminNotifications.POST("", middleware.CheckPolicy("/admin/notifications", "write"), controllers.SendNotification)
		adminNotifications.GET("", middleware.CheckPolicy("/admin/notifications", "read"), controllers.GetSentNotifications)
		adminNotifications.DELETE("/:id", middleware.CheckPolicy("/admin/notifications", "write"), controllers.DeleteNotification)
	}
}
