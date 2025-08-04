package models

import "time"

type Team struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null;unique" json:"name"`
	Password  string    `json:"-"`
	CreatorID uint      `json:"creatorId"`
	Creator   User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"creator,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Solves    []Solve   `json:"solves,omitempty"`
	Hints     []Hint    `gorm:"foreignKey:TeamID" json:"hints,omitempty"`
	Users     []User    `gorm:"foreignKey:TeamID" json:"users,omitempty"`
}
