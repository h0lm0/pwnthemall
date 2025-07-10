package models

import "time"

type Team struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	Name      string `json:"name" gorm:"not null;unique"`
	Password  string `json:"-"`
	Createdat time.Time
	UpdatedAt time.Time
}
