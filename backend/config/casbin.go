package config

import (
	"fmt"

	"github.com/casbin/casbin/v2"
	gormadapter "github.com/casbin/gorm-adapter/v3"
)

func MigrateCasbin() {
	adapter, err := gormadapter.NewAdapterByDB(DB)
	if err != nil {
		panic(fmt.Sprintf("failed to initialize casbin adapter: %v", err))
	}

	enforcer, err := casbin.NewEnforcer("rbac_model.conf", adapter)
	if err != nil {
		panic(fmt.Sprintf("failed to create casbin enforcer: %v", err))
	}
	enforcer.LoadPolicy()
	if hasPolicy, _ := enforcer.HasPolicy("admin", "user", "write"); !hasPolicy {
		enforcer.AddPolicy("admin", "user", "write")
	}
	if hasPolicy, _ := enforcer.HasPolicy("user", "challenge", "read"); !hasPolicy {
		enforcer.AddPolicy("user", "challenge", "read")
	}
	enforcer.SavePolicy()
}
