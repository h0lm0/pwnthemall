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
