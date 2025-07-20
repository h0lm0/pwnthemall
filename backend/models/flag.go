package models

import "time"

type Flag struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Value       string    `json:"value"`
	Team        Team      `json:"team"`
	TeamID      uint      `json:"teamId"`
	Challenge   Challenge `json:"challenge"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
}
