package shared

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func LoadPluginEnv(pluginBinaryPath string) (map[string]string, error) {
	envVars := make(map[string]string)

	pluginName := filepath.Base(pluginBinaryPath)
	pluginName = strings.TrimPrefix(pluginName, "bin-")

	pluginDir := filepath.Join(filepath.Dir(filepath.Dir(pluginBinaryPath)), pluginName)
	envPath := filepath.Join(pluginDir, ".env")

	if _, err := os.Stat(envPath); os.IsNotExist(err) {
		return envVars, nil
	}

	file, err := os.Open(envPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open .env file: %v", err)
	}
	defer file.Close()

	// Lire ligne par ligne
	scanner := bufio.NewScanner(file)
	lineNum := 0

	for scanner.Scan() {
		lineNum++
		line := strings.TrimSpace(scanner.Text())

		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			return nil, fmt.Errorf("invalid format at line %d: %s", lineNum, line)
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		value = strings.Trim(value, `"'`)

		envVars[key] = value
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading .env file: %v", err)
	}

	return envVars, nil
}

func MergeEnvToConfig(config map[string]interface{}, envVars map[string]string) map[string]interface{} {
	for key, value := range envVars {
		configKey := strings.ToLower(key)
		config[configKey] = value
	}
	return config
}
