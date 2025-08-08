import { UserBadge } from '@/models/Badge';

export const createMockBadges = (): UserBadge[] => {
  const badgeData = [
    {
      id: 1,
      name: "First Blood",
      description: "First to solve a challenge",
      icon: "🩸",
      color: "red",
      type: "achievement"
    },
    {
      id: 2,
      name: "Speed Demon",
      description: "Solved challenges quickly",
      icon: "⚡",
      color: "yellow",
      type: "achievement"
    },
    {
      id: 3,
      name: "Crypto Master",
      description: "Master of cryptography challenges",
      icon: "🔐",
      color: "cyan",
      type: "achievement"
    }
  ];

  return badgeData.map((badge, index) => ({
    id: index + 1,
    userId: 1,
    badgeId: badge.id,
    badge: {
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      type: badge.type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    awardedAt: new Date().toISOString()
  }));
}; 