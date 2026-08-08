import type { Role } from '@libreta/shared';

/** Debe reflejar SessionUserView del backend (apps/api/src/auth/auth.service.ts). */
export interface SessionUser {
  id: string;
  displayName: string;
  username: string;
  role: Role;
  organizationId: string;
  organizationName: string;
  mustChangePassword: boolean;
  employeeId: string | null;
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}
