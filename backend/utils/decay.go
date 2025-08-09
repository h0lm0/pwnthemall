package utils

import (
	"math"
	"pwnthemall/config"
	"pwnthemall/models"
)

type DecayService struct{}

func NewDecay() *DecayService {
	return &DecayService{}
}

// CalculateDecayedPoints calcule les points décayés selon la formule
func (ds *DecayService) CalculateDecayedPoints(challenge *models.Challenge, solveCount int) int {
	// Si aucune decay formula n'est définie, retourner les points de base
	if challenge.DecayFormulaID == 0 {
		return challenge.Points
	}

	var decay models.DecayFormula
	if err := config.DB.Where("id = ?", challenge.DecayFormulaID).First(&decay).Error; err != nil {
		// Si la decay formula n'existe pas, retourner les points de base
		return challenge.Points
	}

	basePoints := challenge.Points

	switch decay.Type {
	case "linear":
		return ds.calculateLinearDecay(basePoints, solveCount, &decay)
	case "logarithmic":
		return ds.calculateLogarithmicDecay(basePoints, solveCount, &decay)
	case "exponential":
		return ds.calculateExponentialDecay(basePoints, solveCount, &decay)
	case "custom":
		return ds.calculateCustomDecay(basePoints, solveCount, &decay)
	default:
		return basePoints
	}
}

func (ds *DecayService) calculateLinearDecay(basePoints, solveCount int, decay *models.DecayFormula) int {
	if solveCount <= 0 {
		return basePoints
	}

	totalDecay := int(float64(solveCount) * float64(decay.DecayStep))
	final := basePoints - totalDecay

	if final < decay.MinPoints {
		return decay.MinPoints
	}
	return final
}

func (ds *DecayService) calculateLogarithmicDecay(basePoints, solveCount int, decay *models.DecayFormula) int {
	if solveCount <= 0 {
		return basePoints
	}

	base := decay.DecayStep
	if base <= 1 {
		base = 2.0
	}

	logFactor := math.Log(float64(solveCount)+1) / math.Log(float64(base))
	decayAmount := int(logFactor * float64(basePoints))
	final := basePoints - decayAmount

	if final < decay.MinPoints {
		return decay.MinPoints
	}
	return final
}

func (ds *DecayService) calculateExponentialDecay(basePoints, solveCount int, decay *models.DecayFormula) int {
	if solveCount <= 0 {
		return basePoints
	}

	k := float64(decay.DecayStep)
	if k <= 0 {
		k = 0.1
	}

	decayFactor := math.Exp(-k * float64(solveCount))
	decayedPoints := int(float64(basePoints) * decayFactor)

	if decayedPoints < decay.MinPoints {
		return decay.MinPoints
	}

	return decayedPoints
}

func (ds *DecayService) calculateCustomDecay(basePoints, solveCount int, decay *models.DecayFormula) int {
	// ouais on verra ça une autre fois
	return basePoints
}

func (ds *DecayService) GetSolveCount(challengeID uint) int {
	var count int64
	config.DB.Model(&models.Solve{}).Where("challenge_id = ?", challengeID).Count(&count)
	return int(count)
}
