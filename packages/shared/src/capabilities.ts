import type { Role } from './roles';

/**
 * Capacidades granulares (§5). La AUTORIDAD real vive en los guards del
 * backend; este mapa se usa en el backend para construir los guards y en el
 * frontend SOLO para ocultar/mostrar UI (PermissionGate) — nunca como
 * mecanismo de seguridad por sí mismo.
 */
export const CAPABILITIES = [
  'organization.manage',
  'branch.manage',
  'user.manage',
  'employee.read',
  'employee.manage',
  'movement.create',
  'movement.read.own',
  'movement.read.branch',
  'movement.read.all',
  'movement.approve',
  'movement.reverse',
  'movement.replace',
  'movement.backdate',
  'category.manage',
  'payroll.prepare',
  'payroll.apply',
  'payroll.close',
  'payroll.reopen',
  'report.read',
  'audit.read',
  'settings.manage',
] as const;

export type Capability = (typeof CAPABILITIES)[number];

export const ROLE_CAPABILITIES: Record<Role, readonly Capability[]> = {
  OWNER_ADMIN: [...CAPABILITIES],
  PAYROLL_MANAGER: [
    'employee.read',
    'movement.create',
    'movement.read.all',
    'movement.approve',
    'payroll.prepare',
    'payroll.apply',
    'payroll.close',
    'payroll.reopen',
    'report.read',
  ],
  GENERAL_MANAGER: [
    'employee.read',
    'employee.manage',
    'movement.create',
    'movement.read.all',
    'movement.approve',
    'report.read',
  ],
  BRANCH_MANAGER: [
    'employee.read',
    'employee.manage',
    'movement.create',
    'movement.read.branch',
    'movement.approve',
    'report.read',
  ],
  CASHIER_RECORDER: ['employee.read', 'movement.create', 'movement.read.branch'],
  EMPLOYEE_SELF_SERVICE: ['movement.read.own'],
};

export function roleHasCapability(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].includes(capability);
}
