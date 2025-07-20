package models

import "time"

type Team struct {
	ID        uint        `json:"id" gorm:"primaryKey"`
	Name      string      `json:"name" gorm:"not null;unique"`
	Password  string      `json:"-"`
	Creator   User        `json:"creator" gorm:"not null"`
	CreatorId uint        `json:"creatorId"`
	CreatedAt time.Time   `json:"createdAt"`
	UpdatedAt time.Time   `json:"updatedAt"`
	Solves    []Challenge `gorm:"many2many:solves" json:"solves,omitempty"`
}
