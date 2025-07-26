package utils

import (
	"archive/tar"
	"bytes"
	"context"
	"io"
	"log"
	"os"
	"path/filepath"
	"pwnthemall/config"

	"github.com/docker/docker/api/types"
)

func EnsureDockerClientConnected() error {
	if _, err := config.DockerClient.Info(context.Background()); err != nil {
		if err := config.ConnectDocker(); err != nil {
			return err
		}
	}
	return nil
}

func TarDirectory(dirPath string) (io.Reader, error) {
	buf := new(bytes.Buffer)
	tw := tar.NewWriter(buf)
	defer tw.Close()

	err := filepath.Walk(dirPath, func(file string, fi os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if fi.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(dirPath, file)
		if err != nil {
			return err
		}

		hdr, err := tar.FileInfoHeader(fi, "")
		if err != nil {
			return err
		}
		hdr.Name = relPath

		if err := tw.WriteHeader(hdr); err != nil {
			return err
		}

		data, err := os.ReadFile(file)
		if err != nil {
			return err
		}
		_, err = tw.Write(data)
		return err
	})

	if err != nil {
		return nil, err
	}
	return buf, nil
}

func BuildDockerImage(slug string) error {
	if err := EnsureDockerClientConnected(); err != nil {
		return err
	}

	tmpDir := filepath.Join(os.TempDir(), slug)
	defer os.RemoveAll(tmpDir)

	if err := DownloadChallengeContext(slug, tmpDir); err != nil {
		return err
	}

	tarReader, err := TarDirectory(tmpDir)
	if err != nil {
		return err
	}

	ctx := context.Background()

	prefix := os.Getenv("PTA_DOCKER_IMAGE_PREFIX")
	if prefix == "" {
		prefix = "pta-"
	}

	imageName := prefix + slug
	buildOptions := types.ImageBuildOptions{
		Tags:       []string{imageName},
		Dockerfile: "Dockerfile",
		Remove:     true,
	}

	buildResponse, err := config.DockerClient.ImageBuild(ctx, tarReader, buildOptions)
	if err != nil {
		return err
	}
	defer buildResponse.Body.Close()

	io.Copy(os.Stdout, buildResponse.Body)

	log.Printf("Built image %s for challenge %s", imageName, slug)
	return nil
}
