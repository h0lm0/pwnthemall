package config

import (
	"pwnthemall/models"
)

func SeedDecayFormulas() {
	formulas := []models.DecayFormula{
		{
			Name:            "No Decay",
			Type:            "none",
			MinPoints:       1,
			MaxDecay:        0,
			DecayRate:       0,
			LinearStep:      0,
			LogarithmicBase: 2,
		},
		{
			Name:            "Linear Decay - Gentle",
			Type:            "linear",
			MinPoints:       10,
			MaxDecay:        0.5,
			DecayRate:       0.1,
			LinearStep:      5,
			LogarithmicBase: 2,
		},
		{
			Name:            "Linear Decay - Aggressive",
			Type:            "linear",
			MinPoints:       5,
			MaxDecay:        0.8,
			DecayRate:       0.2,
			LinearStep:      10,
			LogarithmicBase: 2,
		},
		{
			Name:            "Logarithmic Decay - Gentle",
			Type:            "logarithmic",
			MinPoints:       10,
			MaxDecay:        0.6,
			DecayRate:       0.15,
			LinearStep:      1,
			LogarithmicBase: 2,
		},
		{
			Name:            "Logarithmic Decay - Steep",
			Type:            "logarithmic",
			MinPoints:       5,
			MaxDecay:        0.8,
			DecayRate:       0.3,
			LinearStep:      1,
			LogarithmicBase: 1.5,
		},
	}

	for _, formula := range formulas {
		DB.FirstOrCreate(&formula, models.DecayFormula{Name: formula.Name})
	}
}
