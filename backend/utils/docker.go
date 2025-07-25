package utils

import (
	"bytes"
	"context"
	"io"
	"log"
	"pwnthemall/config"

	"github.com/docker/docker/api/types"
)

func BuildDockerImage(slug string) error {
	dockerfile, err := RetrieveFileContentFromMinio(slug + "/Dockerfile")
	if err != nil {
		return err
	}

	ctx := context.Background()
	log.Println("Creating buffer")
	dockerfileBuffer := bytes.NewBuffer(dockerfile)

	buildOptions := types.ImageBuildOptions{
		Dockerfile: "Dockerfile",
		Tags:       []string{slug},
	}

	buildResponse, err := config.DockerClient.ImageBuild(ctx, dockerfileBuffer, buildOptions)
	if err != nil {
		return err
	}
	defer buildResponse.Body.Close()

	_, err = io.Copy(io.Discard, buildResponse.Body)
	if err != nil {
		return err
	}

	log.Printf("Successfully built image with tag: %s", slug)
	return nil
}
