package models

// DashboardStats represents the overall statistics for the admin dashboard
type DashboardStats struct {
	Challenges  ChallengeStats  `json:"challenges"`
	Users       UserStats       `json:"users"`
	Teams       TeamStats       `json:"teams"`
	Submissions SubmissionStats `json:"submissions"`
	Instances   InstanceStats   `json:"instances"`
}

// ChallengeStats represents challenge-related statistics
type ChallengeStats struct {
	Total      int64            `json:"total"`
	Hidden     int64            `json:"hidden"`
	Intro      int64            `json:"intro"`
	Easy       int64            `json:"easy"`
	Medium     int64            `json:"medium"`
	Hard       int64            `json:"hard"`
	Insane     int64            `json:"insane"`
	Categories map[string]int64 `json:"categories"`
}

// UserStats represents user-related statistics
type UserStats struct {
	Total  int64 `json:"total"`
	Active int64 `json:"active"`
	Banned int64 `json:"banned"`
}

// TeamStats represents team-related statistics
type TeamStats struct {
	Total int64 `json:"total"`
}

// SubmissionStats represents submission-related statistics
type SubmissionStats struct {
	Total       int64   `json:"total"`
	Correct     int64   `json:"correct"`
	Incorrect   int64   `json:"incorrect"`
	SuccessRate float64 `json:"success_rate"`
}

// InstanceStats represents instance-related statistics
type InstanceStats struct {
	Running int64 `json:"running"`
	Total   int64 `json:"total"`
}

// SubmissionTrend represents submission count over time
type SubmissionTrend struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}
