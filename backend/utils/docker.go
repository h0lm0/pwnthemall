package utils

import (
	"archive/tar"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"os"
	"path/filepath"
	"pwnthemall/config"
	"pwnthemall/models"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/api/types/filters"
	"github.com/docker/docker/api/types/network"
	"github.com/docker/go-connections/nat"
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

func streamAndDetectBuildError(r io.Reader) error {
	type buildLine struct {
		Stream      string `json:"stream"`
		Error       string `json:"error"`
		ErrorDetail struct {
			Message string `json:"message"`
		} `json:"errorDetail"`
	}

	decoder := json.NewDecoder(r)
	for decoder.More() {
		var msg buildLine
		if err := decoder.Decode(&msg); err != nil {
			return fmt.Errorf("failed to parse docker build output: %w", err)
		}

		if msg.Error != "" {
			return fmt.Errorf("docker build failed: %s", msg.ErrorDetail.Message)
		}

		if msg.Stream != "" {
			fmt.Print(msg.Stream)
		}
	}
	return nil
}

func FindAvailablePorts(count int) ([]int, error) {
	ports := []int{}

	for len(ports) < count {
		l, err := net.Listen("tcp", ":0")
		if err != nil {
			return nil, fmt.Errorf("impossible de trouver un port libre: %v", err)
		}

		port := l.Addr().(*net.TCPAddr).Port
		ports = append(ports, port)
		l.Close()
	}

	return ports, nil
}

func getDockerImagePrefix() (string, error) {
	var cfg models.DockerConfig
	result := config.DB.First(&cfg)
	if result.Error != nil {
		return "", fmt.Errorf("could not load DockerConfig: %w", result.Error)
	}

	if cfg.ImagePrefix == "" {
		return "pta-", nil
	}
	return cfg.ImagePrefix, nil
}

func BuildDockerImage(slug string) (string, error) {
	if err := EnsureDockerClientConnected(); err != nil {
		return "", err
	}

	tmpDir := filepath.Join(os.TempDir(), slug)
	defer os.RemoveAll(tmpDir)

	if err := DownloadChallengeContext(slug, tmpDir); err != nil {
		return "", err
	}

	tarReader, err := TarDirectory(tmpDir)
	if err != nil {
		return "", err
	}

	ctx := context.Background()

	prefix, err := getDockerImagePrefix()
	if err != nil {
		return "", fmt.Errorf("could not get Docker image prefix: %w", err)
	}

	imageName := prefix + slug
	buildOptions := types.ImageBuildOptions{
		Tags:           []string{imageName},
		Dockerfile:     "Dockerfile",
		Remove:         true,
		SuppressOutput: true,
	}

	buildResponse, err := config.DockerClient.ImageBuild(ctx, tarReader, buildOptions)
	if err != nil {
		return imageName, err
	}
	defer buildResponse.Body.Close()

	if err := streamAndDetectBuildError(buildResponse.Body); err != nil {
		log.Printf("Docker build failed: %v", err)
		return imageName, err
	}

	io.Copy(os.Stdout, buildResponse.Body)
	log.Printf("Built image %s for challenge %s", imageName, slug)

	return imageName, nil
}

func IsImageBuilt(slug string) (string, bool) {
	if err := EnsureDockerClientConnected(); err != nil {
		log.Printf("Docker client not connected: %v", err)
		return "", false
	}

	ctx := context.Background()

	prefix, err := getDockerImagePrefix()
	if err != nil {
		log.Printf("Could not get Docker image prefix: %v", err)
		return "", false
	}

	imageName := prefix + slug

	filtersArgs := filters.NewArgs()
	filtersArgs.Add("reference", imageName)

	images, err := config.DockerClient.ImageList(ctx, types.ImageListOptions{
		Filters: filtersArgs,
	})
	if err != nil {
		log.Printf("Failed to list docker images: %v", err)
		return "", false
	}

	if len(images) > 0 {
		return imageName, true
	}
	return imageName, false
}

func StartDockerInstance(image string, teamId int, userId int, internalPorts []int, hostPorts []int) (string, error) {
	if len(internalPorts) != len(hostPorts) {
		return "", fmt.Errorf("internal and host ports length mismatch")
	}

	if err := EnsureDockerClientConnected(); err != nil {
		return "", fmt.Errorf("docker client not connected: %w", err)
	}

	ctx := context.Background()

	// Use challenge name as base, add unique suffix if needed
	baseContainerName := image
	containerName := baseContainerName

	// Check if container with this name already exists
	existing, err := config.DockerClient.ContainerList(ctx, container.ListOptions{
		All: true,
	})

	if err != nil {
		return "", fmt.Errorf("failed to list containers: %w", err)
	}

	// If container exists, add a unique suffix
	containerExists := false
	for _, c := range existing {
		for _, name := range c.Names {
			if name == "/"+containerName {
				containerExists = true
				break
			}
		}
		if containerExists {
			break
		}
	}

	if containerExists {
		// Add a unique suffix based on team and user
		containerName = fmt.Sprintf("%s_%d_%d", baseContainerName, teamId, userId)
	}

	var dockerCfg models.DockerConfig
	if err := config.DB.First(&dockerCfg).Error; err != nil {
		return "", fmt.Errorf("failed to load docker config from DB: %w", err)
	}

	portBindings := nat.PortMap{}
	exposedPorts := nat.PortSet{}

	for i, internal := range internalPorts {
		containerPort := nat.Port(fmt.Sprintf("%d/tcp", internal))
		hostPort := hostPorts[i]

		exposedPorts[containerPort] = struct{}{}
		portBindings[containerPort] = []nat.PortBinding{
			{HostIP: "0.0.0.0", HostPort: fmt.Sprint(hostPort)},
		}
	}

	hostConfig := &container.HostConfig{
		Resources: container.Resources{
			Memory:   int64(dockerCfg.MaxMemByInstance) * 1024 * 1024,
			NanoCPUs: int64(dockerCfg.MaxCpuByInstance) * 1_000_000_000,
		},
		PortBindings: portBindings,
		AutoRemove:   true,
		RestartPolicy: container.RestartPolicy{
			Name: "no",
		},
	}

	containerTimeout := 60
	resp, err := config.DockerClient.ContainerCreate(
		ctx,
		&container.Config{
			Image:        image,
			Tty:          false,
			ExposedPorts: exposedPorts,
			StopTimeout:  &containerTimeout,
		},
		hostConfig,
		&network.NetworkingConfig{},
		nil,
		containerName,
	)
	if err != nil {
		return "", fmt.Errorf("failed to create container: %w", err)
	}

	if err := config.DockerClient.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", fmt.Errorf("failed to start container: %w", err)
	}

	log.Printf(
		"Started container %s for team %d user %d on host ports %v mapping to internal %v",
		containerName, teamId, userId, hostPorts, internalPorts,
	)
	return resp.ID, nil
}

func StopDockerInstance(containerID string) error {
	log.Printf("DEBUG: Attempting to stop Docker container: %s", containerID)

	if err := EnsureDockerClientConnected(); err != nil {
		log.Printf("DEBUG: Docker client connection failed: %v", err)
		return fmt.Errorf("docker client not connected: %w", err)
	}

	ctx := context.Background()

	if containerID == "" {
		log.Println("DEBUG: containerID invalid, nothing to stop")
		return nil
	}

	log.Printf("DEBUG: Removing container %s with force", containerID)
	if err := config.DockerClient.ContainerRemove(ctx, containerID, container.RemoveOptions{Force: true}); err != nil {
		log.Printf("DEBUG: Failed to remove container %s: %v", containerID, err)
		return fmt.Errorf("failed to remove container %s: %w", containerID, err)
	}

	log.Printf("DEBUG: Successfully stopped and removed container %s", containerID)
	return nil
}
