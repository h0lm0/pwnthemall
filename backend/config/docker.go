package config

import (
	"context"
	"errors"
	"fmt"
	"log"
	"pwnthemall/debug"
	"pwnthemall/models"
	"strings"

	"github.com/docker/cli/cli/connhelper"
	"github.com/docker/docker/client"
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

	// Check if it's a TCP connection (DinD) or SSH connection
	if strings.HasPrefix(dockerCfg.Host, "tcp://") {
		// Direct TCP connection to DinD daemon
		debug.Log("Creating direct TCP connection to Docker daemon: %s", dockerCfg.Host)

		clientOpts := []client.Opt{
			client.WithHost(dockerCfg.Host),
			client.WithAPIVersionNegotiation(),
		}

		cl, err = client.NewClientWithOpts(clientOpts...)
		if err != nil {
			log.Println("Unable to create docker client:", err)
			return fmt.Errorf("unable to create docker client: %s", err.Error())
		}
	} else {
		// SSH connection using connection helper
		debug.Log("Creating SSH connection to Docker daemon: %s", dockerCfg.Host)

		helper, err := connhelper.GetConnectionHelper(dockerCfg.Host)
		if err != nil {
			log.Println("Failed to create connection helper:", err)
			return err
		}
		if helper == nil {
			log.Println("Unable to create connection helper (nil)")
			return errors.New("unable to create connection helper")
		}

		clientOpts := []client.Opt{
			client.WithHost(helper.Host),
			client.WithDialContext(helper.Dialer),
			client.WithAPIVersionNegotiation(),
		}

		cl, err = client.NewClientWithOpts(clientOpts...)
		if err != nil {
			log.Println("Unable to create docker client:", err)
			return fmt.Errorf("unable to create docker client: %s", err.Error())
		}
	}

	if cl == nil {
		log.Println("Unable to create docker client")
		return errors.New("unable to create docker client")
	}

	// Test the connection
	ver, err := cl.ServerVersion(context.Background())
	if err != nil {
		log.Println("Unable to connect to docker daemon:", err)
		return fmt.Errorf("unable to connect to docker daemon: %s", err.Error())
	}
	log.Printf("Connected to %s | Docker Version: %s", dockerCfg.Host, ver.Version)

	DockerClient = cl
	return nil
}
