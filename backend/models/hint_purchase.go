package models

import (
	"time"

	"gorm.io/gorm"
)

type HintPurchase struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	TeamID uint `json:"teamId" gorm:"not null"`
	Team   Team `json:"team" gorm:"foreignKey:TeamID"`

	HintID uint `json:"hintId" gorm:"not null"`
	Hint   Hint `json:"hint" gorm:"foreignKey:HintID"`

	UserID uint `json:"userId" gorm:"not null"`
	User   User `json:"user" gorm:"foreignKey:UserID"`

	Cost int `json:"cost" gorm:"not null"`
}
