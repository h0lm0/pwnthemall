package models

import (
	"time"
	"github.com/lib/pq"
)

type Challenge struct {
	ID                    uint                 `gorm:"primaryKey" json:"id"`
	Slug                  string               `gorm:"unique;not null" json:"slug"`
	Name                  string               `json:"name"`
	Description           string               `json:"description"`
	ChallengeDifficultyID uint                 `json:"difficultyId"`
	ChallengeDifficulty   *ChallengeDifficulty `gorm:"foreignKey:ChallengeDifficultyID" json:"difficulty,omitempty"`
	ChallengeCategoryID   uint                 `json:"categoryId"`
	ChallengeCategory     *ChallengeCategory   `gorm:"foreignKey:ChallengeCategoryID" json:"category,omitempty"`
	ChallengeTypeID       uint                 `json:"typeId"`
	ChallengeType         *ChallengeType       `gorm:"foreignKey:ChallengeTypeID" json:"type,omitempty"`
	CreatedAt             time.Time            `json:"createdAt"`
	UpdatedAt             time.Time            `json:"updatedAt"`
	Author                string               `json:"author"`
	Hidden                bool                 `json:"hidden"`
	Flags                 []Flag               `gorm:"foreignKey:ChallengeID;constraint:OnDelete:CASCADE;" json:"-"`
	Ports                 pq.Int64Array        `gorm:"type:integer[]" json:"ports"`
	Points                int                  `json:"points"` // maybe rename it basePoints
	CurrentPoints         int                  `gorm:"-" json:"currentPoints"`
	DecayFormulaID        uint                 `json:"decayFormulaId"`
	DecayFormula          *DecayFormula        `gorm:"foreignKey:DecayFormulaID" json:"decayFormula,omitempty"`
	Hints                 []Hint               `gorm:"foreignKey:ChallengeID;constraint:OnDelete:CASCADE;" json:"hints,omitempty"`
	FirstBlood            *FirstBlood          `gorm:"foreignKey:ChallengeID;constraint:OnDelete:CASCADE;" json:"firstBlood,omitempty"`
	EnableFirstBlood      bool                 `gorm:"default:false" json:"enableFirstBlood"`
}
