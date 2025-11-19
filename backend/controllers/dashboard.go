package controllers

import (
	"time"

	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/models"
	"github.com/pwnthemall/pwnthemall/backend/utils"

	"github.com/gin-gonic/gin"
)

func GetDashboardStats(c *gin.Context) {
	var stats models.DashboardStats

	// Challenge statistics
	var totalChallenges int64
	config.DB.Model(&models.Challenge{}).Count(&totalChallenges)
	stats.Challenges.Total = totalChallenges

	// Count hidden challenges
	config.DB.Model(&models.Challenge{}).Where("hidden = ?", true).Count(&stats.Challenges.Hidden)

	// Count by difficulty (join with ChallengeDifficulty table), excluding hidden challenges
	config.DB.Model(&models.Challenge{}).
		Joins("LEFT JOIN challenge_difficulties ON challenges.challenge_difficulty_id = challenge_difficulties.id").
		Where("LOWER(challenge_difficulties.name) = ?", "intro").
		Where("hidden = ?", false).
		Count(&stats.Challenges.Intro)
	config.DB.Model(&models.Challenge{}).
		Joins("LEFT JOIN challenge_difficulties ON challenges.challenge_difficulty_id = challenge_difficulties.id").
		Where("LOWER(challenge_difficulties.name) = ?", "easy").
		Where("hidden = ?", false).
		Count(&stats.Challenges.Easy)
	config.DB.Model(&models.Challenge{}).
		Joins("LEFT JOIN challenge_difficulties ON challenges.challenge_difficulty_id = challenge_difficulties.id").
		Where("LOWER(challenge_difficulties.name) = ?", "medium").
		Where("hidden = ?", false).
		Count(&stats.Challenges.Medium)
	config.DB.Model(&models.Challenge{}).
		Joins("LEFT JOIN challenge_difficulties ON challenges.challenge_difficulty_id = challenge_difficulties.id").
		Where("LOWER(challenge_difficulties.name) = ?", "hard").
		Where("hidden = ?", false).
		Count(&stats.Challenges.Hard)
	config.DB.Model(&models.Challenge{}).
		Joins("LEFT JOIN challenge_difficulties ON challenges.challenge_difficulty_id = challenge_difficulties.id").
		Where("LOWER(challenge_difficulties.name) = ?", "insane").
		Where("hidden = ?", false).
		Count(&stats.Challenges.Insane)

	// Count by category
	type CategoryCount struct {
		CategoryID uint
		Count      int64
	}
	var categoryCounts []CategoryCount
	config.DB.Model(&models.Challenge{}).
		Select("challenge_category_id as category_id, COUNT(*) as count").
		Group("challenge_category_id").
		Find(&categoryCounts)

	stats.Challenges.Categories = make(map[string]int64)
	for _, cc := range categoryCounts {
		var category models.ChallengeCategory
		if err := config.DB.First(&category, cc.CategoryID).Error; err == nil {
			stats.Challenges.Categories[category.Name] = cc.Count
		}
	}

	// User statistics
	config.DB.Model(&models.User{}).Count(&stats.Users.Total)
	config.DB.Model(&models.User{}).Where("banned = ?", false).Count(&stats.Users.Active)
	config.DB.Model(&models.User{}).Where("banned = ?", true).Count(&stats.Users.Banned)

	// Team statistics
	config.DB.Model(&models.Team{}).Count(&stats.Teams.Total)

	// Submission statistics
	var totalSubmissions int64
	var correctSubmissions int64

	config.DB.Model(&models.Submission{}).Count(&totalSubmissions)
	config.DB.Model(&models.Solve{}).Count(&correctSubmissions)

	stats.Submissions.Total = totalSubmissions
	stats.Submissions.Correct = correctSubmissions
	stats.Submissions.Incorrect = totalSubmissions - correctSubmissions

	if totalSubmissions > 0 {
		stats.Submissions.SuccessRate = float64(correctSubmissions) / float64(totalSubmissions) * 100
	} else {
		stats.Submissions.SuccessRate = 0
	}

	// Instance statistics
	var runningInstances int64
	var totalInstances int64

	config.DB.Model(&models.Instance{}).Where("status = ?", "running").Count(&runningInstances)
	config.DB.Model(&models.Instance{}).Count(&totalInstances)

	stats.Instances.Running = runningInstances
	stats.Instances.Total = totalInstances

	utils.OKResponse(c, stats)
}

func GetSubmissionTrend(c *gin.Context) {
	// Get submissions for the last 48 hours
	hours := 48
	trends := make([]models.SubmissionTrend, 0, hours)

	now := time.Now()
	for i := hours - 1; i >= 0; i-- {
		startOfHour := now.Add(time.Duration(-i) * time.Hour).Truncate(time.Hour)
		endOfHour := startOfHour.Add(time.Hour)

		var count int64
		config.DB.Model(&models.Submission{}).
			Where("created_at >= ? AND created_at < ?", startOfHour, endOfHour).
			Count(&count)

		trends = append(trends, models.SubmissionTrend{
			Date:  startOfHour.Format("2006-01-02 15:04"),
			Count: count,
		})
	}

	utils.OKResponse(c, trends)
}
