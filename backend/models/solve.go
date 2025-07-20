package models

import "time"

type Solve struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `json:"userId"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`

	User      User      `json:"user"`
	Challenge Challenge `json:"challenge"`
}
