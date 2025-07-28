package models

import (
    "time"
)

type FirstBloodConfig struct {
    ID          uint       `gorm:"primaryKey"`
    ChallengeID uint       `gorm:"uniqueIndex;not null"`
    Challenge   *Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
    MaxTeams    int        `gorm:"not null"`
    Bonuses     string     `gorm:"type:text;not null"` // Liste CSV ou JSON "100,50,25" :(
    CreatedAt   time.Time  `json:"CreatedAt"`
    UpdatedAt   time.Time  `json:"UpdatedAt"`
}
