package models


type DecayFormula struct {
    ID            uint           `gorm:"primaryKey" json:"id"`
    Name          string         `gorm:"unique;not null" json:"name"`
    Type          string         `gorm:"not null" json:"type"`
    DecayStep     int            `gorm:"default:1" json:"decayStep"`
    MinPoints     int            `gorm:"default:10" json:"minPoints,omitempty"`
}

