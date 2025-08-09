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

func Log(format string, v ...interface{}) {
    if debugEnabled {
        log.Printf("[DEBUG] "+format, v...)
    }
}

func Println(v ...interface{}) {
    if debugEnabled {
        args := append([]interface{}{"[DEBUG]"}, v...)
        log.Println(args...)
    }
}

func IsEnabled() bool {
    return debugEnabled
}
