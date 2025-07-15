package config

import (
	"log"
	"pwnthemall/models"

	"github.com/casbin/casbin/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

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
	e, err := casbin.NewEnforcer("casbin_model.conf", "casbin_policies.csv")
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
	seedChallengeCategory()
	seedDefaultUsers()
}
