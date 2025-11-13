package meta

type ComposeChallengeMetadata struct {
	Base  BaseChallengeMetadata `yaml:",inline"`
	Ports []int                 `yaml:"ports"`
}
