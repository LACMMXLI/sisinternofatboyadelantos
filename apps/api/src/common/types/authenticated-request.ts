import type { Request } from 'express';
import type { Role } from '@libreta/shared';

/**
 * Forma del usuario adjuntada al request tras validar el access token.
 * Deliberadamente mínima (payload del JWT): el access token vive poco
 * tiempo (§13), así que no se golpea la base de datos en cada request para
 * revalidar. Las sesiones se revocan a nivel de refresh token.
 */
export interface AuthenticatedUser {
  userId: string;
  organizationId: string;
  role: Role;
  branchIds: string[] | 'ALL';
  employeeId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  requestId: string;
}
