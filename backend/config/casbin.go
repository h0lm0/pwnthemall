package config

import (
	"fmt"
	"os"

	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
)

var CEF *casbin.Enforcer

func seedCasbin() {
	if hasPolicy, _ := CEF.HasPolicy("admin", "/*", "*"); !hasPolicy {
		CEF.AddPolicy("admin", "/*", "*")
	}
	if hasPolicy, _ := CEF.HasPolicy("anonymous", "/login", "*"); !hasPolicy {
		CEF.AddPolicy("anonymous", "/login", "*")
	}
	if hasPolicy, _ := CEF.HasPolicy("anonymous", "/register", "*"); !hasPolicy {
		CEF.AddPolicy("anonymous", "/register", "*")
	}
	if hasPolicy, _ := CEF.HasPolicy("member", "/pwn", "*"); !hasPolicy {
		CEF.AddPolicy("member", "/pwn", "*")
	}
	if hasPolicy, _ := CEF.HasPolicy("member", "/logout", "*"); !hasPolicy {
		CEF.AddPolicy("member", "/logout", "*")
	}
	CEF.SavePolicy()
}

func InitCasbin() *casbin.Enforcer {
	adapter, err := gormadapter.NewAdapterByDB(DB)
	if err != nil {
		panic(fmt.Sprintf("failed to initialize casbin adapter: %v", err))
	}

	enforcer, err := casbin.NewEnforcer("rbac_model.conf", adapter)
	if err != nil {
		panic(fmt.Sprintf("failed to create casbin enforcer: %v", err))
	}
	enforcer.LoadPolicy()
	CEF = enforcer

	if os.Getenv("SEED_CASBIN") == "true" {
		seedCasbin()
	}

	return enforcer
}
