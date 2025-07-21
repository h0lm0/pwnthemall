package models

import "time"

type Solve struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	TeamID      uint       `json:"teamId"`
	Team        *Team      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team,omitempty"`
	ChallengeID uint       `json:"challengeId"`
	Challenge   *Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge,omitempty"`
	Points      int        `json:"points"`
	CreatedAt   time.Time  `json:"createdAt"`
}
