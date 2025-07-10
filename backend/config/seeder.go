package config

import (
	"log"
	"pwnthemall/models"
)

func seedChallengeCategory() {
	challengeCategories := []models.ChallengeCategory{
		{Name: "pwn"},
		{Name: "misc"},
	}
	for _, challengeCategory := range challengeCategories {
		if err := DB.Create(&challengeCategory).Error; err != nil {
			log.Printf("Failed to seed challengeCategory %s: %v\n", challengeCategory.Name, err)
		}
	}
	log.Println("challengeCategories seeded")
}

func SeedDatabase() {
	seedChallengeCategory()
}
