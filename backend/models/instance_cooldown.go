package models

import "time"

// InstanceCooldown tracks when a team last stopped an instance for a challenge.
// A cooldown can be enforced to prevent immediate restarts (team-wide per challenge).
type InstanceCooldown struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	TeamID        uint      `gorm:"index:idx_team_challenge,unique" json:"teamId"`
	ChallengeID   uint      `gorm:"index:idx_team_challenge,unique" json:"challengeId"`
	LastStoppedAt time.Time `json:"lastStoppedAt"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}
