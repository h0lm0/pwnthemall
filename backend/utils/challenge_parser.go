package utils

import (
	"math"
	"strings"
)

// IsWithinRadiusKm returns true if (lat2,lng2) is within radiusKm of (lat1,lng1)
func IsWithinRadiusKm(lat1, lng1, lat2, lng2, radiusKm float64) bool {
	const earthRadiusKm = 6371.0
	dLat := degreesToRadians(lat2 - lat1)
	dLng := degreesToRadians(lng2 - lng1)
	a := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(degreesToRadians(lat1))*math.Cos(degreesToRadians(lat2))*math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	distance := earthRadiusKm * c
	return distance <= radiusKm
}

func degreesToRadians(deg float64) float64 { return deg * math.Pi / 180.0 }

// helpers for encoded geo flags (if needed)
func IsGeoFlag(hashedOrRaw string) bool { return strings.HasPrefix(hashedOrRaw, "geo:") }

// ParseGeoSpecFromHashed is a placeholder; actual flags are hashed, so we can't reverse.
// Kept for compatibility with controller checks; return false by default.
func ParseGeoSpecFromHashed(_ string) (float64, float64, float64, bool) { return 0, 0, 0, false }
