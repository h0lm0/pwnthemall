package models

import "time"

type Submission struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Value       string    `json:"value"`
	User        User      `json:"user"`
	UserID      uint      `json:"userId"`
	Challenge   Challenge `json:"challenge"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
}
