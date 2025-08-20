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
	// Utiliser les points du challenge comme points de base
	basePoints := challenge.Points

	// La position est 0-based, donc on ajoute 1 pour avoir le numéro de solve (1-based)
	solveNumber := solvePosition + 1

	// Si c'est le premier solve, pas de decay
	if solveNumber <= 1 {
		return basePoints
	}

	// Déterminer le type de decay à partir du nom
	decayType := "linear"
	name := strings.ToLower(decay.Name)
	if strings.Contains(name, "exponential") {
		decayType = "exponential"
	} else if strings.Contains(name, "logarithmic") {
		decayType = "logarithmic"
	}

	// Calculer les points selon le type de decay
	var currentPoints int
	switch decayType {
	case "exponential":
		// Pour exponentiel : points perdus augmentent à chaque solve
		exponentialLoss := 0
		for i := 2; i <= solveNumber; i++ {
			exponentialLoss += decay.Step * (i - 1)
		}
		currentPoints = basePoints - exponentialLoss

	case "logarithmic":
		// Pour logarithmique : points perdus diminuent à chaque solve (moins de perte)
		// Utilise une formule logarithmique simplifiée
		if solveNumber <= 2 {
			currentPoints = basePoints - decay.Step
		} else {
			// Réduction logarithmique de la perte
			logarithmicFactor := float64(decay.Step) / (1.5 * float64(solveNumber-1))
			currentPoints = basePoints - int(logarithmicFactor*float64(solveNumber-1))
		}

	default: // "linear" ou autre
		// Perte linéaire standard
		pointsLost := (solveNumber - 1) * decay.Step
		currentPoints = basePoints - pointsLost
	}

	// S'assurer qu'on ne descend pas en dessous du minimum
	if currentPoints < decay.MinPoints {
		currentPoints = decay.MinPoints
	}

	return currentPoints
}
