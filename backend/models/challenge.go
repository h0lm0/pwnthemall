package models

import "time"

type Challenge struct {
	ID                    uint                `gorm:"primaryKey" json:"id"`
	Slug                  string              `gorm:"unique;not null" json:"slug"`
	Name                  string              `json:"name"`
	Description           string              `json:"description"`
	ChallengeDifficulty   ChallengeDifficulty `json:"difficulty"`
	ChallengeDifficultyID uint                `json:"difficultyId"`
	ChallengeCategory     ChallengeCategory   `json:"category"`
	ChallengeCategoryID   uint                `json:"categoryId"`
	ChallengeType         ChallengeType       `json:"type"`
	ChallengeTypeID       uint                `json:"typeId"`
	CreatedAt             time.Time           `json:"createdAt"`
	UpdatedAt             time.Time           `json:"updatedAt"`
	Solvers               []*User             `gorm:"many2many:solves" json:"solvers"`
	Hidden                bool                `json:"hidden"`
}
