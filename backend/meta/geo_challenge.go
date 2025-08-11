package meta

type GeoChallengeMetadata struct {
	Base      BaseChallengeMetadata `yaml:",inline"`
	TargetLat float64               `yaml:"target_lat"`
	TargetLng float64               `yaml:"target_lng"`
	RadiusKm  float64               `yaml:"radius_km"`
}
