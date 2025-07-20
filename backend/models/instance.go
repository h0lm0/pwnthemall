package models

import "time"

type Instance struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Address     string    `json:"address"`
	Team        Team      `json:"team"`
	TeamID      uint      `json:"teamId"`
	Challenge   Challenge `json:"challenge"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
}
