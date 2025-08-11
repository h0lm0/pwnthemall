package meta

import "time"

type BaseChallengeMetadata struct {
	Name        	 string   			 `yaml:"name"`
	Description 	 string   			 `yaml:"description"`
	Category    	 string   			 `yaml:"category"`
	Difficulty  	 string   			 `yaml:"difficulty"`
	Type        	 string   			 `yaml:"type"`
	Author      	 string   			 `yaml:"author"`
	Hidden      	 bool     			 `yaml:"hidden"`
	Flags       	 []string 			 `yaml:"flags"`
	Points      	 int      			 `yaml:"points"`
	DecayFormula	 string				 `yaml:"decay,omitempty"`
	Hints       	 []HintMetadata		 	 `yaml:"hints,omitempty"`
	EnableFirstBlood bool 				 `yaml:"enableFirstBlood"`
	FirstBlood  	 *FirstBloodMetadata 		 `yaml:"firstBlood,omitempty"`
}

type HintMetadata struct {
	Content      string     `yaml:"content"`
	Cost         int        `yaml:"cost"`
	IsActive     bool       `yaml:"isActive"`
	AutoActiveAt *time.Time `yaml:"autoActiveAt"`
}

type FirstBloodMetadata struct {
    Bonuses     []int      `yaml:"bonuses"`
    Badges      []string   `yaml:"badges"`
}
