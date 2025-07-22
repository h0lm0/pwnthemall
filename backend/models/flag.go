package models

import "time"

type Flag struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Value       string     `json:"value"`
	ChallengeID uint       `json:"challengeId"`
	Challenge   *Challenge `gorm:"constraint:OnDelete:CASCADE;" json:"challenge,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}
