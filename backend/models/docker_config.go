package models

type DockerConfig struct {
	ID               uint   `gorm:"primaryKey" json:"id"`
	Host             string `json:"host"`
	ImagePrefix      string `json:"imagePrefix"`
	InstancesByTeam  int    `json:"instancesByTeam"`
	InstancesByUser  int    `json:"instancesByUser"`
	MaxMemByInstance int    `json:"maxMemByInstance"`
	MaxCpuByInstance int    `json:"maxCpuByInstance"`
}
