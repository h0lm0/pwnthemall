package models

import "time"

type Solve struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Team        Team      `json:"team"`
	TeamID      uint      `json:"teamId"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
	Challenge   Challenge `json:"challenge"`
}
