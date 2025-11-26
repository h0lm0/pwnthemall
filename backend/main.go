package main

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/pwnthemall/pwnthemall/backend/config"
	"github.com/pwnthemall/pwnthemall/backend/debug"
	"github.com/pwnthemall/pwnthemall/backend/pluginsystem"
	"github.com/pwnthemall/pwnthemall/backend/routes"
	"github.com/pwnthemall/pwnthemall/backend/utils"
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

	if err := config.ConnectDocker(); err != nil {
		log.Printf("Failed to connect to docker host: %s", err.Error())
	}

	initWebSocketHub()

	// Sync all challenges from MinIO on startup
	log.Println("INFO: Launching initial challenge sync goroutine...")
	go func() {
		ctx := context.Background()
		if err := utils.SyncAllChallengesFromMinIO(ctx, utils.UpdatesHub); err != nil {
			log.Printf("Warning: Initial challenge sync failed: %v", err)
		} else {
			log.Println("INFO: Initial challenge sync goroutine completed successfully")
		}
	}()

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
	router.SetTrustedProxies([]string{"172.70.1.0/24"})
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

	if os.Getenv("PTA_PLUGINS_ENABLED") == "true" {
		debug.Log("Loading plugins...")
		pluginsystem.LoadAllPlugins("/app/plugins/bin", router, config.CEF)
		routes.RegisterPluginRoutes(router)
		defer pluginsystem.ShutdownAllPlugins()
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	debug.Log("Starting server on port %s", port)
	log.Printf("Server starting on port %s", port)
	router.Run(":" + port)
}
