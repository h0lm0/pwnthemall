package controllers

import (
	"pwnthemall/shared"
	"pwnthemall/utils"

	"github.com/gin-gonic/gin"
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
