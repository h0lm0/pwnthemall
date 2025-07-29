package config

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"

	"github.com/docker/cli/cli/connhelper"
	"github.com/docker/docker/client"
)

var DockerClient *client.Client

func ConnectDocker() error {
	SynchronizeEnvWithDb()
	helper, err := connhelper.GetConnectionHelper(os.Getenv("DOCKER_HOST"))

	if err != nil {
		log.Println(err.Error())
		return err
	}

	if helper == nil {
		log.Println("unable to create connection helper")
		return errors.New("unable to create connection helper")
	}

	httpClient := &http.Client{
		Transport: &http.Transport{
			DialContext: helper.Dialer,
		},
	}

	var clientOpts []client.Opt

	clientOpts = append(clientOpts,
		client.WithHTTPClient(httpClient),
		client.WithHost(helper.Host),
		client.WithDialContext(helper.Dialer),
	)

	version := os.Getenv("DOCKER_API_VERSION")

	if version != "" {
		clientOpts = append(clientOpts, client.WithVersion(version))
	} else {
		clientOpts = append(clientOpts, client.WithAPIVersionNegotiation())
	}

	cl, err := client.NewClientWithOpts(clientOpts...)

	if err != nil {
		log.Println("Unable to create docker client")
		return err
	} else if cl == nil {
		log.Println("Unable to create docker client")
		return errors.New("unable to create docker client")
	} else {
		ver, _ := cl.ServerVersion(context.Background())
		log.Printf("Connected to %s | Version: %s", os.Getenv("DOCKER_HOST"), ver.Version)
	}
	DockerClient = cl
	return nil
}
