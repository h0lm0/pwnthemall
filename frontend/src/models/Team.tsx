import { User } from './User';

export interface Team {
  id: number;
  name: string;
  creatorId: number;
  users: User[];
  createdAt?: string;
  updatedAt?: string;
} 