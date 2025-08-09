export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  banned: boolean;
  teamId?: number;
  team?: {
    id: number;
    name: string;
  };
  ipAddresses?: string[];
  memberSince?: string;
  points?: number;
  challengesCompleted?: number;
  totalChallenges?: number;
}

export interface UserFormData {
  username: string;
  email?: string;
  password?: string;
  role?: string;
}
