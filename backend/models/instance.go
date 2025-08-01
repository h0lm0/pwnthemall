package models

import "time"

type Instance struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Container   string    `json:"container"`
	User        User      `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user"`
	UserID      uint      `json:"userId"`
	Team        Team      `gorm:"foreignKey:TeamID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team"`
	TeamID      uint      `json:"teamId"`
	Challenge   Challenge `gorm:"foreignKey:ChallengeID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge"`
	ChallengeID uint      `json:"challengeId"`
	CreatedAt   time.Time `json:"createdAt"`
	ExpiresAt   time.Time `json:"expiresAt"`
	Status      string    `json:"status" gorm:"default:'running'"` // running, stopped, expired
}
