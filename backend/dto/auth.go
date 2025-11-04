package dto

// RegisterInput represents user registration request
type RegisterInput struct {
	Username string `json:"username" binding:"required,max=32"`
	Email    string `json:"email" binding:"required,email,max=254"`
	Password string `json:"password" binding:"required,min=8,max=72"`
	Role     string `json:"role"`
}

// LoginInput represents user login request
type LoginInput struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
