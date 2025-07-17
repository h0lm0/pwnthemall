export interface User {
  ID: number
  Username: string
  Email: string
  Role: string
  CreatedAt?: string
  UpdatedAt?: string
}

export interface UserFormData {
  Username: string
  Email: string
  Password?: string
  Role: string
}
