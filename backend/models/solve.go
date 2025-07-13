package models

import "time"

type Solve struct {
	UserID      uint
	ChallengeID uint
	SolvedAt    time.Time
}
