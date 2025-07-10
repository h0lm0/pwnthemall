package models

import "time"

type Challenge struct {
	ID              uint   `json:"id" gorm:"primaryKey"`
	Name            string `json:"name" gorm:"not null"`
	Description     string `json:"description"`
	Createdat       time.Time
	UpdatedAt       time.Time
	ChallengeTypeId int
	ChallengeType   ChallengeType `gorm:"foreignKey:ChallengeTypeId"`
	Solvers         []User        `gorm:"many2many:solves"`
}
