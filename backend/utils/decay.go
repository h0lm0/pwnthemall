package utils

import (
	"math"
	
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/models"
)

type DecayService struct{}

func NewDecay() *DecayService {
	return &DecayService{}
}

// CalculateCurrentPoints calcule les points actuels d'un challenge en fonction du nombre de solves
func (ds *DecayService) CalculateCurrentPoints(challenge *models.Challenge) int {
	// Si aucune decay formula n'est définie, retourner les points de base
	if challenge.DecayFormulaID == 0 {
		return challenge.Points
	}

	var decay models.DecayFormula
	if err := config.DB.Where("id = ?", challenge.DecayFormulaID).First(&decay).Error; err != nil {
		// Si la decay formula n'existe pas, retourner les points de base
		return challenge.Points
	}

	// Compter le nombre de solves pour ce challenge
	var solveCount int64
	config.DB.Model(&models.Solve{}).Where("challenge_id = ?", challenge.ID).Count(&solveCount)

	// If only one solve, return base points (no decay for first solve)
	if solveCount <= 1 {
		return challenge.Points
	}

	// For decay calculation: use solveCount directly as solveNumber
	// solveCount=2 means 2 solves, so we calculate decay for the 2nd solve
	return ds.calculateSolveBasedDecayDirect(challenge, &decay, int(solveCount))
}

// CalculateDecayedPoints calcule les points pour un solve spécifique en fonction du nombre total de solves
func (ds *DecayService) CalculateDecayedPoints(challenge *models.Challenge, solvePosition int) int {
	// Si aucune decay formula n'est définie, retourner les points de base
	if challenge.DecayFormulaID == 0 {
		return challenge.Points
	}

	var decay models.DecayFormula
	if err := config.DB.Where("id = ?", challenge.DecayFormulaID).First(&decay).Error; err != nil {
		// Si la decay formula n'existe pas, retourner les points de base
		return challenge.Points
	}

	// Utiliser la position du solve comme nombre de solves à ce moment-là
	return ds.calculateSolveBasedDecay(challenge, &decay, solvePosition)
}

// calculateSolveBasedDecay calcule le decay basé sur le nombre de solves (0-based position)
func (ds *DecayService) calculateSolveBasedDecay(challenge *models.Challenge, decay *models.DecayFormula, solvePosition int) int {
	basePoints := challenge.Points

	// La position est 0-based, donc on ajoute 1 pour avoir le numéro de solve (1-based)
	solveNumber := solvePosition + 1

	// Si c'est le premier solve, pas de decay
	if solveNumber <= 1 {
		return basePoints
	}

	var currentPoints int

	// Apply decay based on type
	switch decay.Type {
	case "fixed":
		// No decay - always return base points
		currentPoints = basePoints

	case "logarithmic":
		fallthrough
	default:
		// Logarithmic decay: basePoints - (step * log2(solveNumber))
		// Points decay quickly at first, then slow down
		logValue := math.Log2(float64(solveNumber))
		pointsLost := int(float64(decay.Step) * logValue)
		currentPoints = basePoints - pointsLost
	}

	// S'assurer qu'on ne descend pas en dessous du minimum
	if currentPoints < decay.MinPoints {
		currentPoints = decay.MinPoints
	}

	return currentPoints
}

// calculateSolveBasedDecayDirect calcule le decay basé sur le nombre de solves (1-based count, no conversion)
func (ds *DecayService) calculateSolveBasedDecayDirect(challenge *models.Challenge, decay *models.DecayFormula, solveNumber int) int {
	basePoints := challenge.Points

	// solveNumber is already 1-based (1 = first solve, 2 = second solve, etc.)
	// First solve has no decay
	if solveNumber <= 1 {
		return basePoints
	}

	var currentPoints int

	// Apply decay based on type
	switch decay.Type {
	case "fixed":
		// No decay - always return base points
		currentPoints = basePoints

	case "logarithmic":
		fallthrough
	default:
		// Logarithmic decay: basePoints - (step * log2(solveNumber))
		// Points decay quickly at first, then slow down
		logValue := math.Log2(float64(solveNumber))
		pointsLost := int(float64(decay.Step) * logValue)
		currentPoints = basePoints - pointsLost
	}

	// S'assurer qu'on ne descend pas en dessous du minimum
	if currentPoints < decay.MinPoints {
		currentPoints = decay.MinPoints
	}

	return currentPoints
}
