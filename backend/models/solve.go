package models

import "time"

type Solve struct {
	TeamID      uint       `gorm:"primaryKey" json:"teamId"`
	Team        *Team      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team,omitempty"`
	ChallengeID uint       `gorm:"primaryKey" json:"challengeId"`
	Challenge   *Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge,omitempty"`
	Points      int        `json:"points"`
	CreatedAt   time.Time  `json:"createdAt"`
}
