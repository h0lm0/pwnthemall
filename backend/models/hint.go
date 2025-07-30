package models

import "time"

type Hint struct {
	ID          uint      `gorm:"primaryKey"`
	ChallengeID uint      `gorm:"not null"`
	Content     string    `gorm:"not null"`
	Cost        int       `gorm:"not null;default:0"`
	IsActive    bool      `gorm:"default:true"`
	AutoActiveAt *time.Time `json:"autoActiveAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}