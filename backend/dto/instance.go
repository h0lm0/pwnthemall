package dto

import "time"

type InstanceDTO struct {
	ID          uint      `json:"id"`
	Container   string    `json:"container"`
	UserID      uint      `json:"userId"`
	TeamID      uint      `json:"teamId"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
}
