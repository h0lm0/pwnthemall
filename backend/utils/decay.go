package utils

import (
	"pwnthemall/config"
	"pwnthemall/debug"
	"pwnthemall/models"

	"github.com/expr-lang/expr"
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

	if decay.Formula == "" {
		// by default we put linear
		pointsLost := (solveNumber - 1) * decay.DecayFactor
		currentPoints := basePoints - pointsLost
		if currentPoints < decay.MinPoints {
			return decay.MinPoints
		}
		return currentPoints
	}

	env := map[string]interface{}{
		"points":       basePoints,
		"solveNumber":  solveNumber,
		"decay_factor": decay.DecayFactor,
		"min_points":   decay.MinPoints,
	}

	prog, err := expr.Compile(decay.Formula, expr.Env(env))
	if err != nil {
		debug.Log("Error compiling decay formula '%s': %v", decay.Name, err)
		return basePoints
	}

	output, err := expr.Run(prog, env)
	if err != nil {
		debug.Log("Error running decay formula '%s': %v", decay.Name, err)
		return basePoints
	}

	switch val := output.(type) {
	case int:
		return val
	case float64:
		return int(val)
	default:
		return basePoints
	}
}
