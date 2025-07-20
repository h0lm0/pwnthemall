import { Challenge } from "./Challenge"

export interface ChallengeDifficulty {
  id: number
  name: string
  challenges?: Challenge[]
}

export interface ChallengeDifficultyFormData {
  name: string
}
