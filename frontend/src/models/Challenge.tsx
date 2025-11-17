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
  geoRadiusKm?: number | null
  points?: number
  currentPoints?: number
  order?: number
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
    title?: string
    content: string
    cost: number
    challengeId: number
    purchased?: boolean
  }[]
  maxAttempts?: number
  teamFailedAttempts?: number
}

export interface FirstBlood {
  id: number
  challengeId: number
  teamId: number
  userId: number
  bonuses: number[]
  badges: string[]
  createdAt: string
  updatedAt: string
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
  firstBlood?: FirstBlood
}
