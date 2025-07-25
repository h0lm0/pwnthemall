package config

import (
	"log"
	"os"

	"pwnthemall/models"
)

func SynchronizeEnvWithDb() {
	var configs []models.Config
	if err := DB.Find(&configs).Error; err != nil {
		log.Printf("Failed to load config from database: %v", err)
		return
	}

	for _, cfg := range configs {
		if !cfg.Public {
			continue
		}

		if err := os.Setenv(cfg.Key, cfg.Value); err != nil {
			log.Printf("Failed to set env variable %s: %v", cfg.Key, err)
		} else {
			log.Printf("Env variable set from DB: %s=%s", cfg.Key, cfg.Value)
		}
	}
}
