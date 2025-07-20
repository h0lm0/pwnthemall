import { ChallengeCategory } from "./ChallengeCategory"
import { User } from "./User"

export interface Challenge {
  id: number
  slug: string
  name: string
  description: string
  difficulty: string
  category: ChallengeCategory
  categoryId: number
  createdAt?: string
  updatedAt?: string
  solvers?: User[]
  hidden?: boolean
}

