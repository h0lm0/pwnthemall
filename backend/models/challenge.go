package models

import "time"

type Challenge struct {
	ID                  uint   `gorm:"primaryKey"`
	Slug                string `gorm:"unique;not null"`
	Name                string
	Description         string
	Difficulty          string
	ChallengeCategory   ChallengeCategory
	ChallengeCategoryID uint
	CreatedAt           time.Time
	UpdatedAt           time.Time
	Solvers             []*User `gorm:"many2many:solves"`
	Hidden              bool
}
