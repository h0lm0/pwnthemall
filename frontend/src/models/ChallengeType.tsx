import { Challenge } from "./Challenge"

export interface ChallengeType {
  id: number
  name: string
  challenges?: Challenge[]
}

export interface ChallengeTypeFormData {
  name: string
}
