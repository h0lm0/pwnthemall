	package config

	import (
		"log"
		"os"

		"pwnthemall/models"

		"gorm.io/driver/postgres"
		"gorm.io/gorm"
	)

	var DB *gorm.DB

	func ConnectDB() *gorm.DB {
		dsn := os.Getenv("DATABASE_URL")
		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatal("Failed to connect to database:", err)
		}

		err = db.AutoMigrate(
			&models.Team{}, &models.Solve{},
			&models.User{}, &models.ChallengeCategory{},
			&models.ChallengeType{}, &models.ChallengeDifficulty{},
			&models.Challenge{},
		)
		if err != nil {
			log.Fatal("Failed to migrate database:", err)
		}

		DB = db
		if os.Getenv("SEED_DATABASE") == "true" {
			SeedDatabase()
		}
		return db
	}
