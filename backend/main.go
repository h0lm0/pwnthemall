package main

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"os"
	"pwnthemall/config"
	"pwnthemall/debug"
	"pwnthemall/routes"
	"pwnthemall/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
)

func generateRandomString(n int) (string, error) {
	bytes := make([]byte, n)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}



// initWebSocketHub initializes the WebSocket hubs
func initWebSocketHub() {
	utils.WebSocketHub = utils.NewHub()
	go utils.WebSocketHub.Run()

	utils.UpdatesHub = utils.NewHub()
	go utils.UpdatesHub.Run()
}

func main() {
	config.ConnectDB()
	config.ConnectMinio()
	config.InitCasbin()
	// config.SynchronizeEnvWithDb()
	if err := config.ConnectDocker(); err != nil {
		log.Printf("Failed to connect to docker host: %s", err.Error())
	}

	initWebSocketHub()

	// Start hint activation scheduler
	utils.StartHintScheduler()

	router := gin.Default()

	sessionSecret := os.Getenv("SESSION_SECRET")
	if sessionSecret == "" {
		sessionSecret, _ = generateRandomString(25)
	}
	store := cookie.NewStore([]byte(sessionSecret))
	store.Options(sessions.Options{
		Path:     "/",
		MaxAge:   60 * 60 * 24,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
	})
	router.Use(sessions.Sessions("pwnthemall", store))

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"https://pwnthemall.local", "https://demo.pwnthemall.com"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	routes.RegisterUserRoutes(router)
	routes.RegisterAuthRoutes(router)
	routes.RegisterWebhookRoutes(router)
	routes.RegisterChallengeRoutes(router)
	routes.RegisterChallengeCategoryRoutes(router)
	routes.RegisterTeamRoutes(router)
	routes.RegisterConfigRoutes(router)
	routes.RegisterDockerConfigRoutes(router)
	routes.RegisterInstanceRoutes(router)
	routes.RegisterNotificationRoutes(router)
	routes.RegisterDecayFormulaRoutes(router)
	routes.RegisterSubmissionRoutes(router)
	routes.RegisterDashboardRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	debug.Log("Starting server on port %s", port)
	log.Printf("Server starting on port %s", port)
	router.Run(":" + port)
}
