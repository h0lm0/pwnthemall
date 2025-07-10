package config

import (
	"log"
	"pwnthemall/models"
)

func seedChallengeType() {
	challengeTypes := []models.ChallengeCategory{
		{Name: "pwn"},
		{Name: "misc"},
	}
	for _, challengeType := range challengeTypes {
		if err := DB.Create(&challengeType).Error; err != nil {
			log.Printf("Failed to seed challengeType %s: %v\n", challengeType.Name, err)
		}
	}
	log.Println("challengeTypes seeded")
}

func SeedDatabase() {
	seedChallengeType()
}
