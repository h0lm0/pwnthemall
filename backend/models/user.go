package models

import (
	"time"
)

type User struct {
	ID        uint        `gorm:"primaryKey" json:"id"`
	Username  string      `gorm:"unique;not null" json:"username"`
	Email     string      `gorm:"unique;not null" json:"email"`
	Password  string      `json:"-"`
	Role      string      `gorm:"not null;default:'member'" json:"role"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
	TeamID    *uint       `json:"teamId,omitempty"`
	Team      *Team       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"team,omitempty"`
	Solves    []Challenge `gorm:"many2many:solves" json:"solves,omitempty"`
}

// RegisterInput is used for user registration and creation
// (moved from controllers/auth.go)
type RegisterInput struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	Role     string `json:"role"`
}
