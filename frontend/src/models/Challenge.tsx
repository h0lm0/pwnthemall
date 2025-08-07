import { ChallengeCategory } from "./ChallengeCategory"
import { ChallengeDifficulty } from "./ChallengeDifficulty"
import { ChallengeType } from "./ChallengeType"
import { User } from "./User"
import { Team } from "./Team"

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
  solved?: boolean
  points?: number
  enableFirstBlood?: boolean
  firstBloodBonus?: number
  decayFormula?: {
    id: number
    name: string
    type: string
    decayStep: number
    minPoints: number
  }
  decayFormulaId?: number
  hints?: {
    id: number
    content: string
    cost: number
    challengeId: number
  }[]
}

export interface Solve {
  teamId: number
  team: Team
  challengeId: number
  challenge: Challenge
  points: number
  createdAt: string
  userId?: number
  username?: string
}
