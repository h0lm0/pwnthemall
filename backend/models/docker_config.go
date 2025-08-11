package models

type DockerConfig struct {
	ID                      uint    `gorm:"primaryKey" json:"id"`
	Host                    string  `json:"host"`
	ImagePrefix             string  `json:"imagePrefix"`
	InstancesByTeam         int     `json:"instancesByTeam"`
	InstancesByUser         int     `json:"instancesByUser"`
	MaxMemByInstance        int     `json:"maxMemByInstance"`
	MaxCpuByInstance        float64 `json:"maxCpuByInstance"`
	InstanceTimeout         int     `json:"instanceTimeout"`         // Timeout in minutes (0 = no timeout)
	InstanceCooldownSeconds int     `json:"instanceCooldownSeconds"` // Cooldown after stop before restart (seconds, 0 = disabled)
}
