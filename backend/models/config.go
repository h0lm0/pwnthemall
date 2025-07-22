package models

type Config struct {
	Key   string `gorm:"primaryKey" json:"key"`
	Value string `json:"value"`
}
