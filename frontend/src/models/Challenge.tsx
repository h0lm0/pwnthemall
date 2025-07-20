import { ChallengeCategory } from "./ChallengeCategory"
import { ChallengeDifficulty } from "./ChallengeDifficulty"
import { ChallengeType } from "./ChallengeType"
import { User } from "./User"

export interface Challenge {
  id: number
  slug: string
  name: string
  description: string
  difficulty: ChallengeDifficulty
  difficultyId: number
  type: ChallengeType
  typeId: number
  category: ChallengeCategory
  categoryId: number
  createdAt?: string
  updatedAt?: string
  solvers?: User[]
  author: string
  hidden?: boolean
}

