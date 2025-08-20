package models

type DecayFormula struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"unique;not null" json:"name"`
	DecayFactor int    `gorm:"default:10" json:"decay_factor"` // Facteur de décroissance
	MinPoints   int    `gorm:"default:10" json:"minPoints"`    // Points minimum
}
