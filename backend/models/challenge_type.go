package models

type ChallengeType struct {
	ID         uint        `gorm:"primaryKey" json:"id"`
	Name       string      `gorm:"unique;not null" json:"name"`
	Challenges []Challenge `json:"challenges"`
}
