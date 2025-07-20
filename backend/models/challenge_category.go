package models

type ChallengeCategory struct {
	ID         uint        `gorm:"primaryKey" json:"id"`
	Name       string      `gorm:"unique;not null" json:"name"`
	Challenges []Challenge `json:"challenges"`
}
