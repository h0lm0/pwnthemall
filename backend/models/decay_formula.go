package models

type DecayFormula struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Name      string `gorm:"unique;not null" json:"name"`
	DecayStep int    `gorm:"default:10" json:"decayStep"` // Points perdus par solve
	MinPoints int    `gorm:"default:10" json:"minPoints"` // Points minimum
}
