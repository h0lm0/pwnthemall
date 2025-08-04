package models

type DecayFormula struct {
    ID            uint    `gorm:"primaryKey" json:"id"`
    Name          string  `gorm:"unique;not null" json:"name"`
    Type          string  `gorm:"not null" json:"type"`
    DecayFactor   float64 `gorm:"default:1" json:"decayFactor"`
    Custom        bool    `gorm:"default:false" json:"custom"`
    CustomFormula string  `gorm:"type:text" json:"customFormula,omitempty"`
}
