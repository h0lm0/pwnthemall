package utils

import (
	"testing"
	"pwnthemall/models"
)

func TestCalculateLinearDecay(t *testing.T) {
	ds := NewDecay()

	basePoints := 100
	minPoints := 20

	tests := []struct {
		solveCount int
		decayStep  int
		expected   int
	}{
		{0, 2, 100},  // no decay
		{1, 2, 20},   // log2(2)=1 → decay = 100 → final = MinPoints = 20
		{3, 2, 20},   // log2(4)=2 → decay = 200 → final = MinPoints
		{10, 2, 20},
	}

	for _, tt := range tests {
		decay := &models.DecayFormula{
			Type:      "linear",
			DecayStep: tt.decayStep,
			MinPoints: minPoints,
		}
		got := ds.calculateLinearDecay(basePoints, tt.solveCount, decay)
		if got != tt.expected {
			t.Errorf("linear decay with solveCount=%d, decayStep=%d: got %d, want %d",
				tt.solveCount, tt.decayStep, got, tt.expected)
		}
	}
}

func TestCalculateLogarithmicDecay(t *testing.T) {
	ds := NewDecay()

	basePoints := 100
	minPoints := 20

	tests := []struct {
		solveCount int
		decayStep  int
		expected   int
	}{
		{0, 2, 100},    // pas de decay si solveCount = 0
		{1, 2, 50},     // log2(1+1) = 1, decayAmount = 1 * 100 / 2 = 50 (approx)
		{3, 2, 21},     // log2(3+1)=2, decayAmount=2*100/2=100 mais minPoints=20 donc 21
		{10, 2, 20},    // decay large, mais minPoints = 20
	}

	for _, tt := range tests {
		decay := &models.DecayFormula{
			Type:      "logarithmic",
			DecayStep: tt.decayStep,
			MinPoints: minPoints,
		}
		got := ds.calculateLogarithmicDecay(basePoints, tt.solveCount, decay)

		// On accepte une petite marge d’erreur dû au calcul float
		if got < tt.expected-2 || got > tt.expected+2 {
			t.Errorf("logarithmic decay with solveCount=%d, decayStep=%d: got %d, want approx %d",
				tt.solveCount, tt.decayStep, got, tt.expected)
		}
	}
}

func TestCalculateCustomDecay(t *testing.T) {
	ds := NewDecay()

	basePoints := 100
	solveCount := 10

	decay := &models.DecayFormula{
		Type:      "custom",
		DecayStep: 0.0,
		MinPoints: 10,
	}

	got := ds.calculateCustomDecay(basePoints, solveCount, decay)
	if got != basePoints {
		t.Errorf("custom decay should return basePoints, got %d, want %d", got, basePoints)
	}
}
