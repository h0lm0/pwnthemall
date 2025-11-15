package controllers

import (
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/shared"
	"github.com/pwnthemall/pwnthemall/backend/utils"
)

func GetLoadedPlugins(c *gin.Context) {
	var plugins []map[string]interface{}
	for _, p := range shared.LoadedPlugins {
		plugins = append(plugins, map[string]interface{}{
			"name":        p.Metadata.Name,
			"version":     p.Metadata.Version,
			"description": p.Metadata.Description,
			"author":      p.Metadata.Author,
			"type":        p.Metadata.Type,
		})
	}
	utils.OKResponse(c, plugins)
}
