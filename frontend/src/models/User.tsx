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
}

export interface UserFormData {
  username: string;
  email?: string;
  password?: string;
  role?: string;
}
