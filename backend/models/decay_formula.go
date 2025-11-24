package models

type DecayFormula struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	Name      string `gorm:"unique;not null" json:"name"`
	Type      string `gorm:"default:'logarithmic'" json:"type"` // Type: fixed, logarithmic, dynamic
	Step      int    `gorm:"default:10" json:"step"`           // For logarithmic: multiplier; For dynamic: solves to reach minimum
	MinPoints int    `gorm:"default:10" json:"minPoints"`       // Minimum points floor
}
