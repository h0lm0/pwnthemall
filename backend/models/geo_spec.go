package models

import "time"

// GeoSpec stores the target location and radius for a geo challenge
type GeoSpec struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	ChallengeID uint      `gorm:"uniqueIndex" json:"challengeId"`
	TargetLat   float64   `json:"targetLat"`
	TargetLng   float64   `json:"targetLng"`
	RadiusKm    float64   `json:"radiusKm"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
