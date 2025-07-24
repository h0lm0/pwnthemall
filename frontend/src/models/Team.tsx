import { User } from './User';

export interface Team {
  id: number;
  name: string;
  creatorId: number;
  members: User[];
  createdAt?: string;
  updatedAt?: string;
} 