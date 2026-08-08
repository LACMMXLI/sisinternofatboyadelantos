import type { AuthenticatedUser } from '../types/authenticated-request';

/**
 * Alcance de sucursal derivado del usuario autenticado (§5). OWNER_ADMIN
 * (y cualquier rol futuro con branchIds:'ALL') no se filtra por sucursal;
 * el resto solo ve las sucursales que tiene asignadas vía UserBranch.
 *
 * Devuelve `undefined` cuando no debe aplicarse filtro (alcance total), o
 * un arreglo de IDs para usar en una cláusula Prisma `{ in: ids }`.
 */
export function accessibleBranchIds(
  user: AuthenticatedUser,
): string[] | undefined {
  return user.branchIds === 'ALL' ? undefined : user.branchIds;
}

export function assertBranchAccessible(
  user: AuthenticatedUser,
  branchId: string,
): void {
  if (user.branchIds === 'ALL') return;
  if (!user.branchIds.includes(branchId)) {
    throw new BranchNotAccessibleError();
  }
}

export class BranchNotAccessibleError extends Error {
  constructor() {
    super('No tienes acceso a esta sucursal.');
    this.name = 'BranchNotAccessibleError';
  }
}
