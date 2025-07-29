package controllers

import (
	"encoding/json"
	"log"
	"net/http"
	"pwnthemall/config"
	"pwnthemall/models"
	"pwnthemall/utils"
	"time"

	"github.com/gin-gonic/gin"
)

// NotificationInput represents the input for creating notifications
type NotificationInput struct {
	Title   string `json:"title" binding:"required,max=255"`
	Message string `json:"message" binding:"required"`
	Type    string `json:"type" binding:"required,oneof=info warning error"`
	UserID  *uint  `json:"userId,omitempty"` // null for global notifications
}

// NotificationResponse represents the notification response structure
type NotificationResponse struct {
	ID        uint       `json:"id"`
	Title     string     `json:"title"`
	Message   string     `json:"message"`
	Type      string     `json:"type"`
	ReadAt    *time.Time `json:"readAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

// WebSocketHub is a global variable to manage WebSocket connections
var WebSocketHub *utils.Hub

// InitWebSocketHub initializes the WebSocket hub
func InitWebSocketHub() {
	WebSocketHub = utils.NewHub()
	go WebSocketHub.Run()
}

// SendNotification sends a notification to users
func SendNotification(c *gin.Context) {
	var input NotificationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Get the sender's user ID
	senderID := c.GetUint("user_id")

	// Create notification in database
	notification := models.Notification{
		Title:   input.Title,
		Message: input.Message,
		Type:    input.Type,
		UserID:  input.UserID,
	}

	if err := config.DB.Create(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification: " + err.Error()})
		return
	}

	// Prepare notification message for WebSocket
	notificationMsg := NotificationResponse{
		ID:        notification.ID,
		Title:     notification.Title,
		Message:   notification.Message,
		Type:      notification.Type,
		CreatedAt: notification.CreatedAt,
	}

	messageBytes, err := json.Marshal(notificationMsg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to marshal notification"})
		return
	}

	// Send via WebSocket
	if input.UserID != nil {
		// Send to specific user
		WebSocketHub.SendToUser(*input.UserID, messageBytes)
	} else {
		// Send to all connected users except the sender
		WebSocketHub.SendToAllExcept(messageBytes, senderID)
	}

	c.JSON(http.StatusCreated, notificationMsg)
}

// GetUserNotifications retrieves notifications for the current user
func GetUserNotifications(c *gin.Context) {
	userID := c.GetUint("user_id")

	var notifications []models.Notification
	result := config.DB.Where("user_id = ? OR user_id IS NULL", userID).
		Order("created_at DESC").
		Limit(50).
		Find(&notifications)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	// Convert to response format
	var response []NotificationResponse
	for _, notification := range notifications {
		response = append(response, NotificationResponse{
			ID:        notification.ID,
			Title:     notification.Title,
			Message:   notification.Message,
			Type:      notification.Type,
			ReadAt:    notification.ReadAt,
			CreatedAt: notification.CreatedAt,
		})
	}

	// Ensure we always return an array, even if empty
	if response == nil {
		response = []NotificationResponse{}
	}

	// Log the response for debugging
	log.Printf("User %d notifications: %+v", userID, response)

	c.JSON(http.StatusOK, response)
}

// MarkNotificationAsRead marks a notification as read
func MarkNotificationAsRead(c *gin.Context) {
	userID := c.GetUint("user_id")
	notificationID := c.Param("id")

	var notification models.Notification
	result := config.DB.Where("id = ? AND (user_id = ? OR user_id IS NULL)", notificationID, userID).
		First(&notification)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	now := time.Now()
	notification.ReadAt = &now

	if err := config.DB.Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

// MarkAllNotificationsAsRead marks all notifications for a user as read
func MarkAllNotificationsAsRead(c *gin.Context) {
	userID := c.GetUint("user_id")

	now := time.Now()
	result := config.DB.Model(&models.Notification{}).
		Where("(user_id = ? OR user_id IS NULL) AND read_at IS NULL", userID).
		Update("read_at", now)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notifications as read"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// GetUnreadCount returns the count of unread notifications for the current user
func GetUnreadCount(c *gin.Context) {
	userID := c.GetUint("user_id")

	var count int64
	result := config.DB.Model(&models.Notification{}).
		Where("(user_id = ? OR user_id IS NULL) AND read_at IS NULL", userID).
		Count(&count)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread count"})
		return
	}

	// Log the count for debugging
	log.Printf("User %d unread count: %d", userID, count)

	c.JSON(http.StatusOK, gin.H{"count": count})
}

// GetSentNotifications retrieves all sent notifications (admin only)
func GetSentNotifications(c *gin.Context) {
	var notifications []models.Notification
	result := config.DB.Order("created_at DESC").Limit(100).Find(&notifications)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	// Log the raw notifications for debugging
	log.Printf("Raw notifications from DB: %+v", notifications)

	// Convert to response format with user info
	type SentNotificationResponse struct {
		ID        uint      `json:"id"`
		Title     string    `json:"title"`
		Message   string    `json:"message"`
		Type      string    `json:"type"`
		UserID    *uint     `json:"userId,omitempty"`
		Username  *string   `json:"username,omitempty"`
		CreatedAt time.Time `json:"createdAt"`
	}

	var response []SentNotificationResponse
	for _, notification := range notifications {
		resp := SentNotificationResponse{
			ID:        notification.ID,
			Title:     notification.Title,
			Message:   notification.Message,
			Type:      notification.Type,
			UserID:    notification.UserID,
			CreatedAt: notification.CreatedAt,
		}

		if notification.User != nil {
			resp.Username = &notification.User.Username
		}

		response = append(response, resp)
	}

	// Ensure we always return an array, even if empty
	if response == nil {
		response = []SentNotificationResponse{}
	}

	log.Printf("Final response: %+v", response)
	c.JSON(http.StatusOK, response)
}

// DeleteNotification deletes a notification (admin only)
func DeleteNotification(c *gin.Context) {
	notificationID := c.Param("id")

	var notification models.Notification
	if err := config.DB.First(&notification, notificationID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}

	if err := config.DB.Delete(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification deleted"})
}
