package models

import "time"

type FirstBlood struct {
    ID          uint       `gorm:"primaryKey"`
    ChallengeID uint       `gorm:"not null"`
    Challenge   *Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
    TeamID      uint       `gorm:"not null"`
    Team        *Team      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
    UserID      uint       `gorm:"not null"` 
    User        *User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
    Bonuses     string     `gorm:"type:text;not null"` // Bonuses in JSON format
    CreatedAt   time.Time  `json:"createdAt"`
    UpdatedAt   time.Time  `json:"updatedAt"`
    }