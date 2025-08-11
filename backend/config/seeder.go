package config

import (
	"log"
	"os"
	"pwnthemall/models"
	"strconv"
	"time"

	"github.com/casbin/casbin/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// getEnvWithDefault returns the environment variable value or a default if not set
func getEnvWithDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// CTFStatus represents the current status of the CTF
type CTFStatus string

const (
	CTFNotStarted CTFStatus = "not_started"
	CTFActive     CTFStatus = "active"
	CTFEnded      CTFStatus = "ended"
	CTFNoTiming   CTFStatus = "no_timing" // When no start/end times are configured
)

// GetCTFStatus returns the current status of the CTF based on start and end times
func GetCTFStatus() CTFStatus {
	var startConfig, endConfig models.Config

	// Get start time
	if err := DB.Where("key = ?", "CTF_START_TIME").First(&startConfig).Error; err != nil {
		return CTFNoTiming
	}

	// Get end time
	if err := DB.Where("key = ?", "CTF_END_TIME").First(&endConfig).Error; err != nil {
		return CTFNoTiming
	}

	// If either time is empty, no timing is configured
	if startConfig.Value == "" || endConfig.Value == "" {
		return CTFNoTiming
	}

	// Parse times (expecting RFC3339 format: 2006-01-02T15:04:05Z07:00)
	startTime, err := time.Parse(time.RFC3339, startConfig.Value)
	if err != nil {
		log.Printf("Failed to parse CTF start time")
		return CTFNoTiming
	}

	endTime, err := time.Parse(time.RFC3339, endConfig.Value)
	if err != nil {
		log.Printf("Failed to parse CTF end time: %v", err)
		return CTFNoTiming
	}

	now := time.Now()

	if now.Before(startTime) {
		return CTFNotStarted
	} else if now.After(endTime) {
		return CTFEnded
	} else {
		return CTFActive
	}
}

// IsCTFActive returns true if the CTF is currently active
func IsCTFActive() bool {
	status := GetCTFStatus()
	return status == CTFActive || status == CTFNoTiming
}

// IsCTFStarted returns true if the CTF has started (active or ended)
func IsCTFStarted() bool {
	status := GetCTFStatus()
	return status == CTFActive || status == CTFEnded || status == CTFNoTiming
}

func seedConfig() {
	config := []models.Config{
		{Key: "SITE_NAME", Value: os.Getenv("PTA_SITE_NAME"), Public: true},
		{Key: "REGISTRATION_ENABLED", Value: getEnvWithDefault("PTA_REGISTRATION_ENABLED", "false"), Public: true},
		{Key: "CTF_START_TIME", Value: getEnvWithDefault("PTA_CTF_START_TIME", ""), Public: true},
		{Key: "CTF_END_TIME", Value: getEnvWithDefault("PTA_CTF_END_TIME", ""), Public: true},
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

func seedDockerConfig() {
	var existing models.DockerConfig
	err := DB.First(&existing).Error
	if err == nil {
		log.Println("Seeding: docker config already exists, skipping")
		return
	}

	iByTeam, err := strconv.Atoi(os.Getenv("PTA_DOCKER_INSTANCES_BY_TEAM"))
	if err != nil {
		iByTeam = 15
	}

	iByUser, err := strconv.Atoi(os.Getenv("PTA_DOCKER_INSTANCES_BY_USER"))
	if err != nil {
		iByUser = 5
	}

	maxMem, err := strconv.Atoi(os.Getenv("PTA_DOCKER_MAXMEM_PER_INSTANCE"))
	if err != nil {
		maxMem = 256
	}

	maxCpu, err := strconv.ParseFloat(os.Getenv("PTA_DOCKER_MAXCPU_PER_INSTANCE"), 64)
	if err != nil {
		maxCpu = 0.01
	}

	instanceTimeout, err := strconv.Atoi(os.Getenv("PTA_DOCKER_INSTANCE_TIMEOUT"))
	if err != nil {
		instanceTimeout = 60 // Default 60 minutes
	}

	// Cooldown seconds between stop and next start for same team/challenge
	cooldownEnv := getEnvWithDefault("PTA_DOCKER_INSTANCE_COOLDOWN_SECONDS", "0")
	cooldownSeconds, err := strconv.Atoi(cooldownEnv)
	if err != nil {
		cooldownSeconds = 0 // Disabled by default
	}

	config := models.DockerConfig{
		Host:                    os.Getenv("PTA_DOCKER_HOST"),
		ImagePrefix:             os.Getenv("PTA_DOCKER_IMAGE_PREFIX"),
		MaxMemByInstance:        maxMem,
		MaxCpuByInstance:        maxCpu,
		InstancesByTeam:         iByTeam,
		InstancesByUser:         iByUser,
		InstanceTimeout:         instanceTimeout,
		InstanceCooldownSeconds: cooldownSeconds,
	}

	if err := DB.Create(&config).Error; err != nil {
		log.Printf("Failed to seed docker config: %s", err.Error())
		return
	}
	log.Println("Seeding: docker config finished")
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
		{Name: "geo"},
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
		{Username: "user1", Email: "user1@user.user", Password: "user1", Role: "member"},
		{Username: "user2", Email: "user2@user.user", Password: "user2", Role: "member"},
		{Username: "user3", Email: "user3@user.user", Password: "user3", Role: "member"},
		{Username: "user4", Email: "user4@user.user", Password: "user4", Role: "member"},
		{Username: "user5", Email: "user5@user.user", Password: "user5", Role: "member"},
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
	seedDockerConfig()
	seedChallengeDifficulty()
	seedChallengeCategory()
	seedChallengeType()
	seedDefaultUsers()
}
