package main

import (
	"os"

	"pwnthemall/config"
	"pwnthemall/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	config.ConnectDB()

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://pwnthemall.local:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	routes.RegisterUserRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router.Run(":" + port)
}
