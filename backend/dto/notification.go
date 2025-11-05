package dto

import "time"

// NotificationInput represents notification creation request
type NotificationInput struct {
	Title   string `json:"title" binding:"required,max=255"`
	Message string `json:"message" binding:"required"`
	Type    string `json:"type" binding:"required,oneof=info warning error success"`
	UserID  *uint  `json:"userId"`
	TeamID  *uint  `json:"teamId"`
}

// NotificationResponse represents notification with read status
type NotificationResponse struct {
	ID        uint       `json:"id"`
	Title     string     `json:"title"`
	Message   string     `json:"message"`
	Type      string     `json:"type"`
	ReadAt    *time.Time `json:"readAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

// SentNotificationResponse represents sent notification with full details
type SentNotificationResponse struct {
	ID        uint       `json:"id"`
	Title     string     `json:"title"`
	Message   string     `json:"message"`
	Type      string     `json:"type"`
	UserID    *uint      `json:"userId,omitempty"`
	TeamID    *uint      `json:"teamId,omitempty"`
	Username  *string    `json:"username,omitempty"`
	TeamName  *string    `json:"teamName,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}
