package models

type ChallengeCategory struct {
	ID   uint   `gorm:"primaryKey"`
	Name string `gorm:"unique;not null"`
}
