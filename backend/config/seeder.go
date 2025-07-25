package config

import (
	"log"
	"os"
	"pwnthemall/models"

	"github.com/casbin/casbin/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func seedConfig() {
	config := []models.Config{
		{Key: "SITE_NAME", Value: os.Getenv("PTA_SITE_NAME"), Public: false},
		{Key: "FLAG_PREFIX", Value: os.Getenv("PTA_FLAG_PREFIX"), Public: false},
		{Key: "DOCKER_HOST", Value: os.Getenv("PTA_DOCKER_HOST"), Public: true},
		{Key: "DOCKER_TLS_VERIFY", Value: os.Getenv("PTA_DOCKER_TLS_VERIFY"), Public: true},
	}

	for _, item := range config {
		var existing models.Config
		err := DB.Where("key = ?", item.Key).First(&existing).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			continue
		}
		if err == nil {
			continue
		}
		if err := DB.Create(&item).Error; err != nil {
			log.Printf("Failed to seed config %s: %v\n", item.Key, err)
		}
	}
	log.Println("Seeding: config finished")
}

func seedChallengeCategory() {
	challengeCategories := []models.ChallengeCategory{
		{Name: "pwn"},
		{Name: "misc"},
	}
	for _, challengeCategory := range challengeCategories {
		var existing models.ChallengeCategory
		err := DB.Where("name = ?", challengeCategory.Name).First(&existing).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			log.Printf("Failed to check challengeCategory %s: %v\n", challengeCategory.Name, err)
			continue
		}
		if err == nil {
			continue
		}
		if err := DB.Create(&challengeCategory).Error; err != nil {
			log.Printf("Failed to seed challengeCategory %s: %v\n", challengeCategory.Name, err)
		}
	}
	log.Println("Seeding: challengeCategories finished")
}

func seedChallengeType() {
	challengeTypes := []models.ChallengeType{
		{Name: "standard"},
		{Name: "docker"},
		{Name: "compose"},
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
	log.Println("Seeding: challengeTypes finished")
}

func seedChallengeDifficulty() {
	challengeDifficulties := []models.ChallengeDifficulty{
		{Name: "intro"},
		{Name: "easy"},
		{Name: "medium"},
		{Name: "hard"},
		{Name: "insane"},
	}
	for _, challengeDifficulty := range challengeDifficulties {
		var existing models.ChallengeDifficulty
		err := DB.Where("name = ?", challengeDifficulty.Name).First(&existing).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			log.Printf("Failed to check challengeDifficulty %s: %v\n", challengeDifficulty.Name, err)
			continue
		}
		if err == nil {
			continue
		}
		if err := DB.Create(&challengeDifficulty).Error; err != nil {
			log.Printf("Failed to seed challengeDifficulty %s: %v\n", challengeDifficulty.Name, err)
		}
	}
	log.Println("Seeding: challengeTypes finished")
}

func seedDefaultUsers() {
	users := []models.User{
		{Username: "admin", Email: "admin@admin.admin", Password: "admin", Role: "admin"},
		{Username: "user", Email: "user@user.user", Password: "user", Role: "member"},
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
	log.Println("Seeding: users finished")
}

func SeedCasbin(enforcer *casbin.Enforcer) {
	log.Println("Seeding: Casbin rules..")
	if hasPolicy, _ := enforcer.HasPolicy("anonymous", "/login", "*"); !hasPolicy {
		enforcer.AddPolicy("anonymous", "/login", "*")
	}
	if hasPolicy, _ := enforcer.HasPolicy("anonymous", "/register", "*"); !hasPolicy {
		enforcer.AddPolicy("anonymous", "/register", "*")
	}

	if hasPolicy, _ := enforcer.HasPolicy("member", "/pwn", "*"); !hasPolicy {
		enforcer.AddPolicy("member", "/pwn", "*")
	}
	if hasPolicy, _ := enforcer.HasPolicy("member", "/logout", "*"); !hasPolicy {
		enforcer.AddPolicy("member", "/logout", "*")
	}

	if hasPolicy, _ := enforcer.HasPolicy("admin", "/*", "*"); !hasPolicy {
		enforcer.AddPolicy("admin", "/*", "*")
	}
	enforcer.SavePolicy()
	log.Println("Seeding: Casbin finished")

}

func SeedCasbinFromCsv(enforcer *casbin.Enforcer) {
	log.Println("Seeding: Casbin rules from CSV..")
	e, err := casbin.NewEnforcer("config/casbin_model.conf", "config/casbin_policies.csv")
	if err != nil {
		log.Fatal(err.Error())
	}
	e.LoadPolicy()
	e.SetAdapter(enforcer.GetAdapter())
	e.SavePolicy()
	log.Println("Seeding: Casbin from CSV finished")
}

func SeedDatabase() {
	log.Println("Seeding: Database..")
	seedConfig()
	seedChallengeDifficulty()
	seedChallengeCategory()
	seedChallengeType()
	seedDefaultUsers()
}
