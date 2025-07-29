package models

import "time"

type Notification struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	Title     string     `gorm:"not null;size:255" json:"title"`
	Message   string     `gorm:"not null;type:text" json:"message"`
	Type      string     `gorm:"not null;default:'info';size:20" json:"type"` // info, warning, error
	UserID    *uint      `json:"userId,omitempty"`                            // null for global notifications
	User      *User      `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	ReadAt    *time.Time `json:"readAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}
