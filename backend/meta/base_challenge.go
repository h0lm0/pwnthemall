package meta

type BaseChallengeMetadata struct {
	Name             string              `yaml:"name"`
	Description      string              `yaml:"description"`
	Category         string              `yaml:"category"`
	Difficulty       string              `yaml:"difficulty"`
	Type             string              `yaml:"type"`
	Author           string              `yaml:"author"`
	Hidden           bool                `yaml:"hidden"`
	Flags            []string            `yaml:"flags"`
	Points           int                 `yaml:"points"`
	ConnectionInfo   []string            `yaml:"connection_info,omitempty"`
	DecayFormula     string              `yaml:"decay,omitempty"`
	Hints            []HintMetadata      `yaml:"hints,omitempty"`
	EnableFirstBlood bool                `yaml:"enableFirstBlood"`
	FirstBlood       *FirstBloodMetadata `yaml:"firstBlood,omitempty"`
}

type HintMetadata struct {
	Title        string  `yaml:"title"`
	Content      string  `yaml:"content"`
	Cost         int     `yaml:"cost"`
	IsActive     bool    `yaml:"is_active"`
	AutoActiveAt *string `yaml:"auto_activate_at,omitempty"`
}

type FirstBloodMetadata struct {
	Bonuses []int    `yaml:"bonuses"`
	Badges  []string `yaml:"badges"`
}

type DecayFormula struct {
	Name      string `yaml:"name"`
	Step      int    `yaml:"step"`
	MinPoints int    `yaml:"min_points"`
}
