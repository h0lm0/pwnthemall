package dto

import "time"

type FirstBloodDTO struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"userId"`
	Username  string    `json:"username"`
	TeamID    uint      `json:"teamId"`
	TeamName  string    `json:"teamName"`
	Bonuses   []int64   `json:"bonuses"`
	Badges    []string  `json:"badges"`
	CreatedAt time.Time `json:"createdAt"`
}
