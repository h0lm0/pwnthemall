package services

import (
	"math"
	"pwnthemall/config"
	"pwnthemall/models"
)

type DecayService struct{}

func NewDecayService() *DecayService {
	return &DecayService{}
}

// CalculateDecayedPoints calculates the current points for a challenge based on solve count and decay formula
func (ds *DecayService) CalculateDecayedPoints(challenge *models.Challenge, solveCount int) int {
	if challenge.DecayFormula == nil {
		return challenge.Points
	}

	basePoints := challenge.Points
	formula := challenge.DecayFormula

	switch formula.Type {
	case "linear":
		return ds.calculateLinearDecay(basePoints, solveCount, formula)
	case "logarithmic":
		return ds.calculateLogarithmicDecay(basePoints, solveCount, formula)
	case "custom":
		return ds.calculateCustomDecay(basePoints, solveCount, formula)
	default:
		return basePoints
	}
}

// calculateLinearDecay implements linear decay: points decrease by a fixed amount per solve
func (ds *DecayService) calculateLinearDecay(basePoints, solveCount int, formula *models.DecayFormula) int {
	if solveCount <= 0 {
		return basePoints
	}

	// Calculate total decay
	totalDecay := solveCount * formula.LinearStep
	
	// Apply max decay limit
	maxDecayPoints := int(float64(basePoints) * formula.MaxDecay)
	if totalDecay > maxDecayPoints {
		totalDecay = maxDecayPoints
	}
	
	// Calculate final points
	finalPoints := basePoints - totalDecay
	
	// Ensure minimum points
	if finalPoints < formula.MinPoints {
		finalPoints = formula.MinPoints
	}
	
	return finalPoints
}

// calculateLogarithmicDecay implements logarithmic decay: points decrease more slowly as more teams solve it
func (ds *DecayService) calculateLogarithmicDecay(basePoints, solveCount int, formula *models.DecayFormula) int {
	if solveCount <= 0 {
		return basePoints
	}

	// Calculate logarithmic decay factor
	logValue := math.Log(float64(solveCount)+1) / math.Log(formula.LogarithmicBase)
	decayFactor := logValue * formula.DecayRate
	
	// Apply max decay limit
	if decayFactor > formula.MaxDecay {
		decayFactor = formula.MaxDecay
	}
	
	// Calculate final points
	decayAmount := int(float64(basePoints) * decayFactor)
	finalPoints := basePoints - decayAmount
	
	// Ensure minimum points
	if finalPoints < formula.MinPoints {
		finalPoints = formula.MinPoints
	}
	
	return finalPoints
}

// calculateCustomDecay uses a custom formula (placeholder for future implementation)
func (ds *DecayService) calculateCustomDecay(basePoints, solveCount int, formula *models.DecayFormula) int {
	// For now, return base points if custom formula is not implemented
	// In the future, this could parse and evaluate custom mathematical expressions
	return basePoints
}

// GetSolveCount returns the number of solves for a specific challenge
func (ds *DecayService) GetSolveCount(challengeID uint) int {
	var count int64
	config.DB.Model(&models.Solve{}).Where("challenge_id = ?", challengeID).Count(&count)
	return int(count)
}
