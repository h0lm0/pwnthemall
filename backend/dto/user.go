package dto

// UserInput represents user creation/update request
type UserInput struct {
	Username string `json:"username" binding:"required,max=32"`
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password" binding:"omitempty,min=8,max=72"`
	Role     string `json:"role" binding:"required,oneof=member admin"`
	TeamID   *uint  `json:"teamId"`
}
