package models

import (
	"time"

	"github.com/lib/pq"
)

type FirstBlood struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	ChallengeID uint           `gorm:"not null" json:"challengeId"`
	Challenge   *Challenge     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge,omitempty"`
	TeamID      uint           `gorm:"not null" json:"teamId"`
	Team        *Team          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team,omitempty"`
	UserID      uint           `gorm:"not null" json:"userId"`
	User        *User          `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	Bonuses     pq.Int64Array  `gorm:"type:integer[];not null" json:"bonuses"`
	Badges      pq.StringArray `gorm:"type:text[];not null" json:"badges"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt"`
}
