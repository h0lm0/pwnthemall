package models

type DecayFormula struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"unique;not null" json:"name"`
	DecayFactor int    `gorm:"default:10" json:"decay_factor"` 
	MinPoints   int    `gorm:"default:10" json:"minPoints"`
	Formula     string `json:"formula"` // sous forme expr, ex: "max(points - (solveNumber - 1) * decay_factor, min_points)"
}
