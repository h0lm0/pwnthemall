package models

import "time"

type Badge struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`  // Icon/emoji for the badge
	Color       string    `json:"color"` // Badge color (hex code or CSS class)
	Type        string    `json:"type"`  // Type of badge (e.g., "firstblood", "achievement", "milestone")
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// UserBadge represents the many-to-many relationship between users and badges
type UserBadge struct {
	ID          uint       `gorm:"primaryKey" json:"id"`
	UserID      uint       `json:"userId"`
	User        *User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"user,omitempty"`
	BadgeID     uint       `json:"badgeId"`
	Badge       *Badge     `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"badge,omitempty"`
	ChallengeID *uint      `json:"challengeId,omitempty"` // For challenge-specific badges like firstblood
	Challenge   *Challenge `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"challenge,omitempty"`
	TeamID      *uint      `json:"teamId,omitempty"` // For team-based badges
	Team        *Team      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"team,omitempty"`
	AwardedAt   time.Time  `json:"awardedAt"`
}
