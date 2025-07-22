package utils

import (
	"crypto/sha256"
	"encoding/hex"
)

func HashFlag(flag string) string {
	hash := sha256.Sum256([]byte(flag))
	return hex.EncodeToString(hash[:])
}