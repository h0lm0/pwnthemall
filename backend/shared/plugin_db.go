package shared

import (
	"fmt"
	"log"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type PluginDBConfig struct {
	ConnectionString string
	MaxIdleConns     int
	MaxOpenConns     int
	ConnMaxLifetime  time.Duration
	LogLevel         logger.LogLevel
}

func DefaultPluginDBConfig(connectionString string) PluginDBConfig {
	return PluginDBConfig{
		ConnectionString: connectionString,
		MaxIdleConns:     10,
		MaxOpenConns:     100,
		ConnMaxLifetime:  time.Hour,
		LogLevel:         logger.Warn,
	}
}

func ConnectPluginDB(config PluginDBConfig) (*gorm.DB, error) {
	if config.ConnectionString == "" {
		return nil, fmt.Errorf("database connection string is empty")
	}

	log.Printf("Connecting to database...")

	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(config.LogLevel),
	}

	db, err := gorm.Open(postgres.Open(config.ConnectionString), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %v", err)
	}

	sqlDB.SetMaxIdleConns(config.MaxIdleConns)
	sqlDB.SetMaxOpenConns(config.MaxOpenConns)
	sqlDB.SetConnMaxLifetime(config.ConnMaxLifetime)

	log.Printf("Successfully connected to database")
	return db, nil
}

func ClosePluginDB(db *gorm.DB) error {
	if db != nil {
		sqlDB, err := db.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

func AutoMigrateModels(db *gorm.DB, models ...interface{}) error {
	log.Printf("Running auto-migration for %d models...", len(models))
	if err := db.AutoMigrate(models...); err != nil {
		return fmt.Errorf("failed to migrate models: %v", err)
	}
	log.Printf("Auto-migration completed successfully")
	return nil
}
