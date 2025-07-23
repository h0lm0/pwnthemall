export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  banned: boolean;
}

export interface UserFormData {
  username: string;
  email?: string;
  password?: string;
  role?: string;
}
