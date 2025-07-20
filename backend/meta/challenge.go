package meta

type ChallengeMetadata struct {
	Name        string `yaml:"name"`
	Description string `yaml:"description"`
	Category    string `yaml:"category"`
	Difficulty  string `yaml:"difficulty"`
	Type        string `yaml:"type"`
	Author      string `yaml:"author"`
	Hidden      bool   `yaml:"hidden"`
}
