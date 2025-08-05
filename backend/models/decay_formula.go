package models

type DecayFormula struct {
	ID                uint    `gorm:"primaryKey" json:"id"`
	Name              string  `gorm:"unique;not null" json:"name"`
	Type              string  `gorm:"not null" json:"type"` // "linear", "logarithmic", "custom"
	DecayFactor       float64 `gorm:"default:1" json:"decayFactor"`
	MinPoints         int     `gorm:"default:1" json:"minPoints"`         // Minimum points after decay
	MaxDecay          float64 `gorm:"default:0.5" json:"maxDecay"`        // Maximum percentage of points to decay (0.5 = 50%)
	DecayRate         float64 `gorm:"default:0.1" json:"decayRate"`       // Rate of decay (used differently by each formula type)
	Custom            bool    `gorm:"default:false" json:"custom"`
	CustomFormula     string  `gorm:"type:text" json:"customFormula,omitempty"`
	LinearStep        int     `gorm:"default:1" json:"linearStep"`        // Points to deduct per solve for linear decay
	LogarithmicBase   float64 `gorm:"default:2.0" json:"logarithmicBase"` // Base for logarithmic decay calculation
}
