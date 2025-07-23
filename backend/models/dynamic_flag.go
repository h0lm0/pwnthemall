package models

import "time"

type DynamicFlag struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Value       string    `json:"value"`
	Team        Team      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team"`
	TeamID      uint      `json:"teamId"`
	Challenge   Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
}
