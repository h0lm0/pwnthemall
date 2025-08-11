package models

type DecayFormula struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Name      string `gorm:"unique;not null" json:"name"`
	Step int    `gorm:"default:10" json:"step"` // Points perdus par solve
	MinPoints int    `gorm:"default:10" json:"minPoints"` // Points minimum
}
