package config

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"pwnthemall/models"

	"github.com/docker/cli/cli/connhelper"
	"github.com/docker/docker/client"
)

var DockerClient *client.Client

func ConnectDocker() error {
	var dockerCfg models.DockerConfig
	if err := DB.First(&dockerCfg).Error; err != nil {
		log.Println("Unable to load DockerConfig from DB:", err)
		return err
	}

	if dockerCfg.Host == "" {
		return errors.New("DockerConfig.Host is empty in DB")
	}

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

	cl, err := client.NewClientWithOpts(clientOpts...)
	if err != nil {
		log.Println("Unable to create docker client:", err)
		return errors.New("unable to create docker client")
	}

	if cl == nil {
		log.Println("Unable to create docker client")
		return errors.New("unable to create docker client")
	}

	ver, err := cl.ServerVersion(context.Background())
	if err != nil {
		log.Println("Unable to create docker client:", err)
		return fmt.Errorf("unable to create docker client: %s", err.Error())
	}
	log.Printf("Connected to %s | Docker Version: %s", dockerCfg.Host, ver.Version)

	DockerClient = cl
	return nil
}
