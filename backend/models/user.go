package models

import (
	"time"
)

type User struct {
	ID       uint   `gorm:"primaryKey"`
	Username string `gorm:"not null"`
	Email    string `gorm:"unique;not null"`
	Password string `json:"-"`
	Role     string `json:"-" gorm:"not null;default:'member'"`
	// Uuid      string `json:"-"`
	CreatedAt time.Time
	UpdatedAt time.Time
	TeamID    *uint
	Team      *Team       `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	Solves    []Challenge `gorm:"many2many:solves"`
}
