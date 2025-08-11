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
  ports?: number[]
  connectionInfo?: string[]
  points?: number
  enableFirstBlood?: boolean
  firstBloodBonuses?: number[]
  firstBloodBadges?: string[]
  decayFormula?: {
    id: number
    name: string
    type: string
    step: number
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
