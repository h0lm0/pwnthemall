export interface IndividualLeaderboardEntry {
  rank: number;
  id: number;
  username: string;
  points: number;
  solves: number;
  teamId?: number;
  teamName?: string;
}

export interface TeamLeaderboardEntry {
  rank: number;
  id: number;
  name: string;
  points: number;
  solves: number;
  memberCount: number;
}
