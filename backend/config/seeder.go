package config

import (
	"log"
	"pwnthemall/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func seedChallengeType() {
	challengeTypes := []models.ChallengeType{
		{Name: "pwn"},
		{Name: "misc"},
	}
	for _, challengeType := range challengeTypes {
		var existing models.ChallengeType
		err := DB.Where("name = ?", challengeType.Name).First(&existing).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			log.Printf("Failed to check challengeType %s: %v\n", challengeType.Name, err)
			continue
		}
		if err == nil {
			continue
		}
		if err := DB.Create(&challengeType).Error; err != nil {
			log.Printf("Failed to seed challengeType %s: %v\n", challengeType.Name, err)
		}
	}
	log.Println("challengeTypes seeded")
}

func seedDefaultUsers() {
	users := []models.User{
		{Username: "swinowz", Email: "mail@swinowz.com", Password: "swinowz"},
		{Username: "h0lm", Email: "mail@h0lm.com", Password: "h0lm"},
		{Username: "credentials", Email: "mail@credentials.com", Password: "credentials"},
	}

	for _, user := range users {
		var existing models.User
		err := DB.Where("username = ? OR email = ?", user.Username, user.Email).First(&existing).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			log.Printf("Failed to check user %s: %v\n", user.Username, err)
			continue
		}
		if err == nil {
			continue // user already exists
		}

		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Failed to hash password for user %s: %v\n", user.Username, err)
			continue
		}
		user.Password = string(hashedPassword)
		if err := DB.Create(&user).Error; err != nil {
			log.Printf("Failed to seed user %s: %v\n", user.Username, err)
		}
	}
	log.Println("users seeded")
}

func SeedDatabase() {
	seedChallengeType()
	seedDefaultUsers()
}
