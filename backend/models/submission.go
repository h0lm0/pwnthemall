package models

import "time"

type Submission struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	Value       string     `json:"value"`
	IsCorrect   bool       `gorm:"default:false" json:"isCorrect"`
	UserID uint   `json:"userId"`
	User   *User  `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	ChallengeID uint       `json:"challengeId"`
	Challenge   *Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"challenge,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
}
