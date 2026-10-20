// Model: forma de los datos de autenticación (Fase 5).
export type UserRole = 'ADMIN' | 'OWNER' | 'SELLER' | 'VIEWER';

export interface AuthUser {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
