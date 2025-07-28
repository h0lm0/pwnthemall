package models

import "time"

type Hint struct {
    ID          uint      `gorm:"primaryKey"`
    ChallengeID uint      `gorm:"not null"`
    Content     string    `gorm:"not null"`
    Cost        int       `gorm:"not null"`
    IsActive    bool      `gorm:"default:true"`
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
