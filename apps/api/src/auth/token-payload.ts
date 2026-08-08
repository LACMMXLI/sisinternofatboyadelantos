import type { Role } from '@libreta/shared';

/**
 * Payload del access token (JWT, corto, en memoria del cliente — nunca en
 * localStorage). branchIds es 'ALL' para roles con alcance de todo el
 * negocio (OWNER_ADMIN); para el resto, la lista de sucursales asignadas al
 * momento de emitir el token (se refresca en cada login/refresh).
 */
export interface AccessTokenPayload {
  sub: string; // userId
  organizationId: string;
  role: Role;
  branchIds: string[] | 'ALL';
  employeeId: string | null;
}
