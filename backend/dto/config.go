package dto

// ConfigInput represents configuration update request
type ConfigInput struct {
	Key   string `json:"key" binding:"required"`
	Value  string `json:"value" binding:"required"`
	Public      *bool `json:"public"`
	SyncWithEnv *bool `json:"syncWithEnv"`
}
