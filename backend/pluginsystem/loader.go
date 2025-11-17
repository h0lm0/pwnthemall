package pluginsystem

import (
	"os"
	"os/exec"
	"path/filepath"

	"github.com/casbin/casbin/v2"
	"github.com/gin-gonic/gin"
	"github.com/hashicorp/go-plugin"
	"github.com/pwnthemall/pwnthemall/backend/debug"
	"github.com/pwnthemall/pwnthemall/backend/shared"
)

func LoadAllPlugins(pluginDir string, router *gin.Engine, enforcer *casbin.Enforcer) {
	files, err := filepath.Glob(filepath.Join(pluginDir, "bin-*"))
	if err != nil {
		debug.Log("Failed to list plugins: %v", err)
		return
	}

	if len(files) == 0 {
		debug.Log("No plugins found in %s", pluginDir)
		return
	}

	debug.Log("Found these plugins files: %v", files)

	handshakeConfig := plugin.HandshakeConfig{
		ProtocolVersion:  1,
		MagicCookieKey:   "PWNTHEMALL_PLUGIN",
		MagicCookieValue: os.Getenv("PTA_PLUGIN_MAGIC_VALUE"),
	}

	for _, file := range files {
		loadSinglePlugin(file, router, enforcer, handshakeConfig)
	}
}

func loadSinglePlugin(file string, router *gin.Engine, enforcer *casbin.Enforcer, handshakeConfig plugin.HandshakeConfig) {
	pluginName := filepath.Base(file)
	debug.Log("Loading plugin: %s", pluginName)

	envVars, err := shared.LoadPluginEnv(file)
	if err != nil {
		debug.Log("Failed to load .env for %s: %v", pluginName, err)
		return
	}

	if len(envVars) > 0 {
		debug.Log("Loaded %d environment variables for %s", len(envVars), pluginName)
	}

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
		return
	}

	raw, err := rpcClient.Dispense("generic")
	if err != nil {
		debug.Log("Failed to dispense plugin %s: %v", file, err)
		return
	}

	plug := raw.(shared.Plugin)
	metadata := plug.GetMetadata()
	metadata.EnvVars = envVars

	plugConfig := shared.MergeEnvToConfig(map[string]interface{}{}, envVars)

	debug.Log("Initializing plugin %s with config", metadata.Name)

	if err := plug.Initialize(plugConfig); err != nil {
		debug.Log("Failed to initialize plugin %s: %v", metadata.Name, err)
		client.Kill()
		return
	}

	registrar := NewGinRouteRegistrar(router, plug, enforcer)

	if err := plug.RegisterRoutes(registrar); err != nil {
		debug.Log("Failed to register routes for %s: %v", metadata.Name, err)
		client.Kill()
		return
	}

	shared.LoadedPlugins[metadata.Name] = &shared.LoadedPlugin{
		Client:   client,
		Plugin:   plug,
		Metadata: metadata,
	}

	debug.Log("✓ Loaded plugin: %s v%s (%s)", metadata.Name, metadata.Version, metadata.Type)
}

func ShutdownAllPlugins() {
	for name, p := range shared.LoadedPlugins {
		debug.Log("Shutting down plugin: %s", name)
		p.Plugin.Shutdown()
		p.Client.Kill()
	}
}
