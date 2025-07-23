package models

import "time"

type Instance struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Address     string    `json:"address"`
	Team        Team      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team"`
	TeamID      uint      `json:"teamId"`
	Challenge   Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
}
