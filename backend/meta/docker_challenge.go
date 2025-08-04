package meta

type DockerChallengeMetadata struct {
	Base  BaseChallengeMetadata `yaml:",inline"`
	Ports []int                 `yaml:"ports"`
}
