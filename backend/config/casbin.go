package config

import (
	"fmt"
	"os"

	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
)

var CEF *casbin.Enforcer

func InitCasbin() *casbin.Enforcer {
	adapter, err := gormadapter.NewAdapterByDB(DB)
	if err != nil {
		panic(fmt.Sprintf("failed to initialize casbin adapter: %v", err))
	}

	enforcer, err := casbin.NewEnforcer("config/casbin_model.conf", adapter)
	if err != nil {
		panic(fmt.Sprintf("failed to create casbin enforcer: %v", err))
	}
	enforcer.LoadPolicy()
	CEF = enforcer

	if os.Getenv("PTA_SEED_CASBIN") == "true" {
		SeedCasbin(CEF)
	}

	if os.Getenv("PTA_SEED_CASBIN_CSV") == "true" {
		SeedCasbinFromCsv(CEF)
	}

	return enforcer
}
