package controllers

import (
	"os"

	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/shared"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

func GetLoadedPlugins(c *gin.Context) {
	var plugins []map[string]interface{}
	for _, p := range shared.LoadedPlugins {
		pluginInfo := map[string]interface{}{
			"name":        p.Metadata.Name,
			"version":     p.Metadata.Version,
			"description": p.Metadata.Description,
			"author":      p.Metadata.Author,
			"type":        p.Metadata.Type,
		}

		if os.Getenv("PTA_DEBUG_ENABLED") == "true" {
			pluginInfo["env_vars"] = p.Metadata.EnvVars
		} else {
			envKeys := []string{}
			for key := range p.Metadata.EnvVars {
				envKeys = append(envKeys, key)
			}
			pluginInfo["env_vars_keys"] = envKeys
		}

		plugins = append(plugins, pluginInfo)
	}
	utils.OKResponse(c, plugins)
}
