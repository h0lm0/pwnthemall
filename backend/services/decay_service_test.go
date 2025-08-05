package services

import (
	"pwnthemall/models"
	"testing"
)

func TestLinearDecay(t *testing.T) {
	ds := NewDecayService()

	// Test case 1: No solves
	challenge := &models.Challenge{
		Points: 100,
		DecayFormula: &models.DecayFormula{
			Type:       "linear",
			MinPoints:  10,
			MaxDecay:   0.5,
			LinearStep: 5,
		},
	}

	points := ds.CalculateDecayedPoints(challenge, 0)
	if points != 100 {
		t.Errorf("Expected 100 points for 0 solves, got %d", points)
	}

	// Test case 2: 5 solves (5 * 5 = 25 points decay)
	points = ds.CalculateDecayedPoints(challenge, 5)
	if points != 75 {
		t.Errorf("Expected 75 points for 5 solves, got %d", points)
	}

	// Test case 3: Max decay reached (50% of 100 = 50 points max decay)
	points = ds.CalculateDecayedPoints(challenge, 10)
	if points != 50 {
		t.Errorf("Expected 50 points (max decay), got %d", points)
	}

	// Test case 4: Still at max decay (50 points) - min not reached
	points = ds.CalculateDecayedPoints(challenge, 20)
	if points != 50 {
		t.Errorf("Expected 50 points (max decay), got %d", points)
	}
}

func TestLogarithmicDecay(t *testing.T) {
	ds := NewDecayService()

	challenge := &models.Challenge{
		Points: 100,
		DecayFormula: &models.DecayFormula{
			Type:            "logarithmic",
			MinPoints:       10,
			MaxDecay:        0.8,
			DecayRate:       0.3,
			LogarithmicBase: 2,
		},
	}

	// Test case 1: No solves
	points := ds.CalculateDecayedPoints(challenge, 0)
	if points != 100 {
		t.Errorf("Expected 100 points for 0 solves, got %d", points)
	}

	// Test case 2: 3 solves
	points = ds.CalculateDecayedPoints(challenge, 3)
	// log2(4) ≈ 2, so 100 - (100 * 0.3 * 2) = 100 - 60 = 40
	if points != 40 {
		t.Errorf("Expected 40 points for 3 solves, got %d", points)
	}
}

func TestNoDecay(t *testing.T) {
	ds := NewDecayService()

	// Test case: No decay formula
	challenge := &models.Challenge{
		Points:       100,
		DecayFormula: nil,
	}

	points := ds.CalculateDecayedPoints(challenge, 10)
	if points != 100 {
		t.Errorf("Expected 100 points when no decay formula, got %d", points)
	}

	// Test case: Unknown decay type
	challenge.DecayFormula = &models.DecayFormula{
		Type: "unknown",
	}
	points = ds.CalculateDecayedPoints(challenge, 10)
	if points != 100 {
		t.Errorf("Expected 100 points for unknown decay type, got %d", points)
	}
}
