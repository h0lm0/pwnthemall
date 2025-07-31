package models

import "time"

type FirstBlood struct {
    ID          uint       `gorm:"primaryKey" json:"id"`
    ChallengeID uint       `gorm:"not null" json:"challengeId"`
    Challenge   *Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge,omitempty"`
    TeamID      uint       `gorm:"not null" json:"teamId"`
    Team        *Team      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team,omitempty"`
    UserID      uint       `gorm:"not null" json:"userId"`
    User        *User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
    Bonuses     []int      `gorm:"type:text;not null" json:"bonuses"`
    Badge       string     `gorm:"type:text;not null" json:"badge"`
    CreatedAt   time.Time  `json:"createdAt"`
    UpdatedAt   time.Time  `json:"updatedAt"`
    }