package dto

// BadgeInput represents badge creation/update request
type BadgeInput struct {
	Name        string `json:"name" binding:"required,max=100"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Color       string `json:"color"`
	Type        string `json:"type"`
}
