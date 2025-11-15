package config

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"

	"strings"

	"github.com/docker/cli/cli/connhelper"
	"github.com/docker/docker/client"
	"github.com/pwnthemall/pwnthemall/backend/debug"
	"github.com/pwnthemall/pwnthemall/backend/models"
)

var DockerClient *client.Client

func ConnectDocker() error {
	var dockerCfg models.DockerConfig
	if err := DB.First(&dockerCfg).Error; err != nil {
		log.Println("Unable to load DockerConfig from DB:", err)
		log.Println("This might be due to missing environment variables or database seeding issues")
		return err
	}

	debug.Log("Docker config loaded from DB - Host: %s, ImagePrefix: %s", dockerCfg.Host, dockerCfg.ImagePrefix)

	if dockerCfg.Host == "" {
		log.Println("ERROR: DockerConfig.Host is empty in DB")
		return errors.New("DockerConfig.Host is empty in DB")
	}

	var cl *client.Client
	var err error

	// Handle Unix socket directly (local Docker daemon)
	if dockerCfg.Host == "/var/run/docker.sock" || strings.HasPrefix(dockerCfg.Host, "unix://") || strings.HasPrefix(dockerCfg.Host, "/") {
		log.Printf("DEBUG: Using local Unix socket: %s", dockerCfg.Host)

		// For Unix sockets, use a simple client configuration
		clientOpts := []client.Opt{
			client.WithHost("unix://" + strings.TrimPrefix(dockerCfg.Host, "unix://")),
			client.WithAPIVersionNegotiation(),
		}

		cl, err = client.NewClientWithOpts(clientOpts...)
		if err != nil {
			log.Println("Unable to create docker client for Unix socket:", err)
			return fmt.Errorf("unable to create docker client for Unix socket: %w", err)
		}
	} else {
		// Handle remote Docker daemon (SSH, TCP, etc.)
		log.Printf("DEBUG: Using remote Docker daemon: %s", dockerCfg.Host)

		helper, err := connhelper.GetConnectionHelper(dockerCfg.Host)
		if err != nil {
			log.Println("Failed to create connection helper:", err)
			return err
		}
		if helper == nil {
			log.Println("Unable to create connection helper (nil)")
			return errors.New("unable to create connection helper")
		}

		httpClient := &http.Client{
			Transport: &http.Transport{
				DialContext: helper.Dialer,
			},
		}

		clientOpts := []client.Opt{
			client.WithHTTPClient(httpClient),
			client.WithHost(helper.Host),
			client.WithDialContext(helper.Dialer),
			client.WithAPIVersionNegotiation(),
		}

		cl, err = client.NewClientWithOpts(clientOpts...)
		if err != nil {
			log.Println("Unable to create docker client:", err)
			return errors.New("unable to create docker client")
		}
	}

	if cl == nil {
		log.Println("Unable to create docker client")
		return errors.New("unable to create docker client")
	}

	ver, err := cl.ServerVersion(context.Background())
	if err != nil {
		log.Println("Unable to connect to docker daemon:", err)
		return fmt.Errorf("unable to connect to docker daemon: %s", err.Error())
	}
	log.Printf("Connected to %s | Docker Version: %s", dockerCfg.Host, ver.Version)

	DockerClient = cl
	return nil
}
