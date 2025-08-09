package models

import (
	"time"

	"github.com/lib/pq"
)

type Instance struct {
	ID          uint          `gorm:"primaryKey" json:"id"`
	Container   string        `json:"container"`
	User        User          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user"`
	UserID      uint          `json:"userId"`
	Team        Team          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team"`
	TeamID      uint          `json:"teamId"`
	Challenge   Challenge     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge"`
	ChallengeID uint          `json:"challengeId"`
	CreatedAt   time.Time     `json:"createdAt"`
	Ports       pq.Int64Array `gorm:"type:integer[]" json:"ports"`
	ExpiresAt   time.Time     `json:"expiresAt"`
	Status      string        `json:"status" gorm:"default:'running'"` // running, stopped, expired
}
