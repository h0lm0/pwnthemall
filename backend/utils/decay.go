package utils

import (
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

	return ds.calculateSolveBasedDecay(challenge, &decay, int(solveCount))
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

// calculateSolveBasedDecay calcule le decay basé sur le nombre de solves
func (ds *DecayService) calculateSolveBasedDecay(challenge *models.Challenge, decay *models.DecayFormula, solvePosition int) int {
	basePoints := challenge.Points

	// La position est 0-based, donc on ajoute 1 pour avoir le numéro de solve (1-based)
	solveNumber := solvePosition + 1

	// Si c'est le premier solve, pas de decay
	if solveNumber <= 1 {
		return basePoints
	}

	pointsLost := (solveNumber - 1) * decay.Step
	currentPoints := basePoints - pointsLost

	// S'assurer qu'on ne descend pas en dessous du minimum
	if currentPoints < decay.MinPoints {
		currentPoints = decay.MinPoints
	}

	return currentPoints
}
