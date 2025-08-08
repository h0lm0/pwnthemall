package models

import "time"

type Solve struct {
	TeamID      uint       `gorm:"primaryKey" json:"teamId"`
	Team        *Team      `gorm:"foreignKey:TeamID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team,omitempty"`
	ChallengeID uint       `gorm:"primaryKey" json:"challengeId"`
	Challenge   *Challenge `gorm:"foreignKey:ChallengeID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge,omitempty"`
	UserID      uint       `gorm:"not null" json:"userId"`
	User        *User      `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	Points      int        `json:"points"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
	SolvedBy    string     `json:"solvedBy"`
}
