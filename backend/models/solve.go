package models

import "time"

type Solve struct {
	ID          uint `gorm:"primaryKey"`
	UserID      uint
	ChallengeID uint
	CreatedAt   time.Time

	User      User
	Challenge Challenge
}
