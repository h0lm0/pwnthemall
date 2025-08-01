package dto

import (
	"pwnthemall/models"
	"time"
)

type InstanceDTO struct {
	ID          uint             `json:"id"`
	Container   string           `json:"container"`
	UserID      uint             `json:"userId"`
	TeamID      uint             `json:"teamId"`
	ChallengeID uint             `json:"challengeId"`
	User        models.User      `json:"user"`
	Team        models.Team      `json:"team"`
	Challenge   models.Challenge `json:"challenge"`
	CreatedAt   time.Time        `json:"createdAt"`
}
