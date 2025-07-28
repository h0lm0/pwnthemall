package models

import "time"

type FirstBlood struct {
    ID          uint      `gorm:"primaryKey"`
    ChallengeID uint      `gorm:"unique;not null"`
    Challenge   *Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
    TeamID      uint      `gorm:"not null"`
    Team        *Team     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
    UserID      uint      `gorm:"not null"` 
    User        *User     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
    Points      int       `gorm:"not null"`
    CreatedAt   time.Time
}
