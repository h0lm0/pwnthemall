import { Challenge } from "./Challenge"

export interface ChallengeCategory {
  id: number
  name: string
  challenges?: Challenge[]
}

export interface ChallengeCategoryFormData {
  name: string
}
