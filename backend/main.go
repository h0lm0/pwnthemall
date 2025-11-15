package main

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"pwnthemall/config"
	"pwnthemall/controllers"
	"pwnthemall/debug"
	"pwnthemall/routes"
	"pwnthemall/shared"
	"pwnthemall/utils"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/hashicorp/go-plugin"
)

func loadPlugins(pluginDir string, router *gin.Engine) {
	files, err := filepath.Glob(filepath.Join(pluginDir, "*/main.go"))
	if err != nil {
		debug.Log("Failed to list plugins: %v", err)
		return
	}
	debug.Log("Found these plugins files: %v", files)
	handshakeConfig := plugin.HandshakeConfig{
		ProtocolVersion:  1,
		MagicCookieKey:   "PWNTHEMALL_PLUGIN",
		MagicCookieValue: "plugin_system",
	}

	for _, file := range files {
		client := plugin.NewClient(&plugin.ClientConfig{
			HandshakeConfig: handshakeConfig,
			Plugins: map[string]plugin.Plugin{
				"generic": &shared.GenericPlugin{},
			},
			Cmd: exec.Command(file),
		})

		rpcClient, err := client.Client()
		if err != nil {
			debug.Log("Failed to get client for %s: %v", file, err)
			continue
		}

		raw, err := rpcClient.Dispense("generic")
		if err != nil {
			debug.Log("Failed to dispense plugin %s: %v", file, err)
			continue
		}

		plug := raw.(shared.Plugin)
		metadata := plug.GetMetadata()

		config := map[string]interface{}{
			"db_connection": "...",
			// autres configs si besoin
		}
		if err := plug.Initialize(config); err != nil {
			debug.Log("Failed to initialize plugin %s: %v", metadata.Name, err)
			continue
		}

		registrar := &ginRouteRegistrar{
			router: router,
			plugin: plug,
		}
		if err := plug.RegisterRoutes(registrar); err != nil {
			debug.Log("Failed to register routes for %s: %v", metadata.Name, err)
			continue
		}

		shared.LoadedPlugins[metadata.Name] = &shared.LoadedPlugin{
			Client:   client,
			Plugin:   plug,
			Metadata: metadata,
		}

		debug.Log("Loaded plugin: %s v%s (%s)", metadata.Name, metadata.Version, metadata.Type)
	}
}

type ginRouteRegistrar struct {
	router *gin.Engine
	plugin shared.Plugin
}

func (g *ginRouteRegistrar) RegisterRoute(method, path, handlerName string) {
	handler := func(c *gin.Context) {
		// Convertir la requête Gin en RequestData
		body, _ := io.ReadAll(c.Request.Body)
		c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

		requestData := shared.RequestData{
			Method:  c.Request.Method,
			Path:    c.Request.URL.Path,
			Headers: c.Request.Header,
			Body:    body,
			Query:   c.Request.URL.Query(),
		}

		if rpcPlugin, ok := g.plugin.(*shared.PluginRPC); ok {
			response, err := rpcPlugin.HandleRequest(handlerName, requestData)
			if err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}

			for key, value := range response.Headers {
				c.Header(key, value)
			}

			c.Data(response.StatusCode, "application/json", response.Body)
		}
	}

	switch method {
	case "GET":
		g.router.GET(path, handler)
	case "POST":
		g.router.POST(path, handler)
	case "PUT":
		g.router.PUT(path, handler)
	case "DELETE":
		g.router.DELETE(path, handler)
	}

	debug.Log("Registered route: %s %s", method, path)
}

func generateRandomString(n int) (string, error) {
	bytes := make([]byte, n)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

func main() {
	config.ConnectDB()
	config.ConnectMinio()
	config.InitCasbin()

	if err := config.ConnectDocker(); err != nil {
		log.Printf("Failed to connect to docker host: %s", err.Error())
	}

	controllers.InitWebSocketHub()
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

	debug.Log("Loading plugins...")
	loadPlugins("./plugins", router)
	routes.RegisterPluginRoutes(router)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	defer func() {
		for name, p := range shared.LoadedPlugins {
			debug.Log("Shutting down plugin: %s", name)
			p.Plugin.Shutdown()
			p.Client.Kill()
		}
	}()

	debug.Log("Starting server on port %s", port)
	log.Printf("Server starting on port %s", port)
	router.Run(":" + port)
}
