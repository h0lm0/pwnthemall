package pluginsystem

import (
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/middleware"
)

var MiddlewareRegistry = map[string]gin.HandlerFunc{
	"demo": middleware.DemoRestriction,
}

func GetMiddlewares(names []string) []gin.HandlerFunc {
	var middlewares []gin.HandlerFunc
	for _, name := range names {
		if mw, ok := MiddlewareRegistry[name]; ok {
			middlewares = append(middlewares, mw)
		}
	}
	return middlewares
}
