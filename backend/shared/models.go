package shared

type FirewallRequest struct {
	TeamID     uint     `json:"team_id"`
	Ports      []int    `json:"ports"`
	AllowedIPs []string `json:"allowed_ips"`
}
