package debug

import (
	"log"
	"os"
	"strconv"
)

var debugEnabled bool

func init() {
	debugEnabled = isDebugEnabled()
}

// isDebugEnabled checks if debug mode is enabled via environment variable
func isDebugEnabled() bool {
	debugEnv := os.Getenv("PTA_DEBUG_ENABLED")
	if debugEnv == "" {
		return false
	}
	enabled, err := strconv.ParseBool(debugEnv)
	if err != nil {
		return false
	}
	return enabled
}

// Log logs a message only if debug mode is enabled
func Log(format string, v ...interface{}) {
	if debugEnabled {
		log.Printf("[DEBUG] "+format, v...)
	}
}

// Println logs a message only if debug mode is enabled
func Println(v ...interface{}) {
	if debugEnabled {
		args := append([]interface{}{"[DEBUG]"}, v...)
		log.Println(args...)
	}
}

// IsEnabled returns whether debug mode is currently enabled
func IsEnabled() bool {
	return debugEnabled
}
