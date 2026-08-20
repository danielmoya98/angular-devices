export type UserRole = 'admin' | 'tech_support' | 'viewer' | string;

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  is_active: boolean;
  created_at?: string;
}

export type CreateUserDTO = Omit<User, 'id' | 'created_at'>;
export type UpdateUserDTO = Partial<CreateUserDTO>;
