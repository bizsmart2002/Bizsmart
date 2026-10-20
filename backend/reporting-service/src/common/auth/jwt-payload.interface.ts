export type UserRole = 'ADMIN' | 'OWNER' | 'SELLER' | 'VIEWER';

export interface JwtPayload {
  sub: number;
  email: string;
  role: UserRole;
  permissions: string[];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: number;
  email: string;
  role: UserRole;
  permissions: string[];
}
