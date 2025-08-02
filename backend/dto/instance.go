package dto

import (
	"pwnthemall/models"
	"time"
)

// PublicInstanceDTO - Safe for public consumption
type PublicInstanceDTO struct {
	ID          uint      `json:"id"`
	Container   string    `json:"container"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
	Ports       []int64   `json:"ports"`
	ExpiresAt   time.Time `json:"expiresAt"`
	Status      string    `json:"status"`
}

// UserInstanceDTO - For authenticated users (shows their own instances)
type UserInstanceDTO struct {
	ID          uint      `json:"id"`
	Container   string    `json:"container"`
	UserID      uint      `json:"userId"`
	TeamID      uint      `json:"teamId"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
	Ports       []int64   `json:"ports"`
	ExpiresAt   time.Time `json:"expiresAt"`
	Status      string    `json:"status"`
}

// AdminInstanceDTO - Full data for admin access
type AdminInstanceDTO struct {
	ID          uint             `json:"id"`
	Container   string           `json:"container"`
	UserID      uint             `json:"userId"`
	TeamID      uint             `json:"teamId"`
	ChallengeID uint             `json:"challengeId"`
	User        models.User      `json:"user"`
	Team        models.Team      `json:"team"`
	Challenge   models.Challenge `json:"challenge"`
	CreatedAt   time.Time        `json:"createdAt"`
	Ports       []int64          `json:"ports"`
	ExpiresAt   time.Time        `json:"expiresAt"`
	Status      string           `json:"status"`
}

// Legacy InstanceDTO for backward compatibility (deprecated)
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
