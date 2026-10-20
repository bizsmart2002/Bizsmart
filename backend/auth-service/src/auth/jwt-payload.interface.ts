export type UserRole = 'ADMIN' | 'OWNER' | 'SELLER' | 'VIEWER';

// Contenido mínimo del JWT (ver Fase 1, sección 6): sin datos sensibles.
export interface JwtPayload {
  sub: number; // userId
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
