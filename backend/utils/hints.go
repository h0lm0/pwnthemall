package utils

import (
	"log"
	"pwnthemall/config"
	"pwnthemall/models"
	"time"
)

// HintScheduler manages the automatic activation of hints
type HintScheduler struct {
	ticker   *time.Ticker
	stopChan chan bool
	running  bool
}

// NewHintScheduler creates a new hint scheduler
func NewHintScheduler() *HintScheduler {
	return &HintScheduler{
		stopChan: make(chan bool),
		running:  false,
	}
}

// Start begins the hint activation scheduler
func (hs *HintScheduler) Start() {
	if hs.running {
		log.Println("Hint scheduler is already running")
		return
	}

	hs.ticker = time.NewTicker(1 * time.Minute)
	hs.running = true

	log.Println("Hint scheduler started, checking every minute")

	// Check immediately on startup
	ActivateScheduledHints()

	go func() {
		for {
			select {
			case <-hs.ticker.C:
				ActivateScheduledHints()
			case <-hs.stopChan:
				log.Println("Hint scheduler stopped")
				return
			}
		}
	}()
}

// Stop gracefully stops the hint scheduler
func (hs *HintScheduler) Stop() {
	if !hs.running {
		return
	}

	hs.running = false
	if hs.ticker != nil {
		hs.ticker.Stop()
	}
	hs.stopChan <- true
}

// Global scheduler instance
var globalHintScheduler *HintScheduler

// StartHintScheduler starts the global hint scheduler
func StartHintScheduler() {
	if globalHintScheduler == nil {
		globalHintScheduler = NewHintScheduler()
	}
	globalHintScheduler.Start()
}

// StopHintScheduler stops the global hint scheduler
func StopHintScheduler() {
	if globalHintScheduler != nil {
		globalHintScheduler.Stop()
	}
}

// ActivateScheduledHints activates hints that should be auto-activated based on their AutoActiveAt time
func ActivateScheduledHints() {
	now := time.Now()

	// Find hints that should be activated now
	var hints []models.Hint
	if err := config.DB.Where("auto_active_at IS NOT NULL AND auto_active_at <= ? AND is_active = false", now).Find(&hints).Error; err != nil {
		log.Printf("Failed to fetch scheduled hints: %v", err)
		return
	}

	for _, hint := range hints {
		hint.IsActive = true
		if err := config.DB.Save(&hint).Error; err != nil {
			log.Printf("Failed to auto-activate hint %d: %v", hint.ID, err)
		} else {
			log.Printf("Auto-activated hint %d (%s) for challenge %d", hint.ID, hint.Title, hint.ChallengeID)
		}
	}
}

// CheckAndActivateHintsForChallenges activates scheduled hints for a slice of challenges
func CheckAndActivateHintsForChallenges(challenges []models.Challenge) {
	now := time.Now()

	for _, challenge := range challenges {
		for i := range challenge.Hints {
			hint := &challenge.Hints[i]
			// Auto-activate hint if it's time and not already active
			if hint.AutoActiveAt != nil && !hint.IsActive && hint.AutoActiveAt.Before(now) {
				hint.IsActive = true
				if err := config.DB.Save(hint).Error; err != nil {
					log.Printf("Failed to auto-activate hint %d: %v", hint.ID, err)
				} else {
					log.Printf("Auto-activated hint %d (%s) for challenge %d", hint.ID, hint.Title, hint.ChallengeID)
				}
			}
		}
	}
}
