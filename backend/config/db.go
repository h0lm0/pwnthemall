package config

import (
	"log"
	"os"

	"github.com/pwnthemall/pwnthemall/backend/models"
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
		&models.Config{}, &models.DockerConfig{},
		&models.Team{}, &models.Solve{},
		&models.User{}, &models.ChallengeCategory{},
		&models.ChallengeType{}, &models.ChallengeDifficulty{},
		&models.DecayFormula{}, &models.Challenge{}, &models.Flag{},
		&models.Hint{}, &models.HintPurchase{}, &models.FirstBlood{},
		&models.Submission{}, &models.Instance{}, &models.InstanceCooldown{}, &models.DynamicFlag{}, &models.GeoSpec{},
		&models.Notification{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	DB = db

	// fixInstanceUserForeignKey()
	if os.Getenv("PTA_SEED_DATABASE") == "true" {
		SeedDatabase()
	}
	return db
}

// func fixInstanceUserForeignKey() {
// 	DB.Exec(`ALTER TABLE instances DROP CONSTRAINT IF EXISTS fk_instances_user;`)
// 	DB.Exec(`ALTER TABLE instances ADD CONSTRAINT fk_instances_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE;`)
// }
