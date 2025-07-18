import { ChallengeCategory } from "./ChallengeCategory"

export interface Challenge {
  ID: number
  Name: string
  Description: string
  Difficulty: string
  Category: ChallengeCategory
  CreatedAt?: string
  UpdatedAt?: string
}

