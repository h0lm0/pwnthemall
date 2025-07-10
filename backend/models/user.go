package models

import (
	"time"
)

type User struct {
	ID        uint   `gorm:"primaryKey"`
	Username  string `gorm:"not null"`
	Email     string `gorm:"unique;not null"`
	Password  string `json:"-"`
	CreatedAt time.Time
	UpdatedAt time.Time
	TeamID    uint
	Team      Team
	Solves    []Challenge `gorm:"many2many:solves"`
}
