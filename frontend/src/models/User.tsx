export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface UserFormData {
  username: string;
  email?: string;
  password?: string;
  role?: string;
}
