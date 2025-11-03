package utils

import (
	"pwnthemall/config"
	"pwnthemall/models"
	"strings"
)

type DecayService struct{}

func NewDecay() *DecayService {
	return &DecayService{}
}

func (ds *DecayService) CalculateCurrentPoints(challenge *models.Challenge) int {
	if challenge.DecayFormulaID == 0 {
		return challenge.Points
	}

	var decay models.DecayFormula
	if err := config.DB.Where("id = ?", challenge.DecayFormulaID).First(&decay).Error; err != nil {
		return challenge.Points
	}

	var solveCount int64
	config.DB.Model(&models.Solve{}).Where("challenge_id = ?", challenge.ID).Count(&solveCount)

	return ds.calculateSolveBasedDecay(challenge, &decay, int(solveCount))
}

func (ds *DecayService) CalculateDecayedPoints(challenge *models.Challenge, solvePosition int) int {
	if challenge.DecayFormulaID == 0 {
		return challenge.Points
	}

	var decay models.DecayFormula
	if err := config.DB.Where("id = ?", challenge.DecayFormulaID).First(&decay).Error; err != nil {
		return challenge.Points
	}

	return ds.calculateSolveBasedDecay(challenge, &decay, solvePosition)
}
func (ds *DecayService) calculateSolveBasedDecay(challenge *models.Challenge, decay *models.DecayFormula, solvePosition int) int {
	basePoints := challenge.Points

	solveNumber := solvePosition + 1

	if solveNumber <= 1 {
		return basePoints
	}

	decayType := "linear"
	name := strings.ToLower(decay.Name)
	if strings.Contains(name, "exponential") {
		decayType = "exponential"
	} else if strings.Contains(name, "décroissance linéaire") {
		decayType = "decroissance_lineaire"
	}

	var currentPoints int
	switch decayType {
	case "exponential":
		exponentialLoss := 0
		for i := 2; i <= solveNumber; i++ {
			exponentialLoss += decay.DecayFactor * (i - 1)
		}
		currentPoints = basePoints - exponentialLoss

	case "decroissance_lineaire":
		maximum := float64(basePoints)
		minimum := float64(decay.MinPoints)
		solveRatio := float64(solveNumber) / float64(decay.DecayFactor)

		if solveRatio >= 1.0 {
			currentPoints = int(minimum)
		} else {
			currentPoints = int(maximum - (maximum-minimum)*solveRatio)
		}

	default:
		pointsLost := (solveNumber - 1) * decay.DecayFactor
		currentPoints = basePoints - pointsLost
	}
	if currentPoints < decay.MinPoints {
		currentPoints = decay.MinPoints
	}

	return currentPoints
}
