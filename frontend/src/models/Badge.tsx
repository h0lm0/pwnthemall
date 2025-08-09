export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserBadge {
  id: number;
  userId: number;
  badgeId: number;
  badge: Badge;
  challengeId?: number;
  challenge?: {
    id: number;
    name: string;
    slug: string;
  };
  teamId?: number;
  team?: {
    id: number;
    name: string;
  };
  awardedAt: string;
}
