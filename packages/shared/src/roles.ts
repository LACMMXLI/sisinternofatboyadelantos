/**
 * Roles del sistema (§5 del prompt maestro). Sin lógica de servidor: solo el
 * vocabulario compartido entre API y web para evitar strings mágicos
 * duplicados.
 */
export const ROLES = [
  'OWNER_ADMIN',
  'PAYROLL_MANAGER',
  'GENERAL_MANAGER',
  'BRANCH_MANAGER',
  'CASHIER_RECORDER',
  'EMPLOYEE_SELF_SERVICE',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  OWNER_ADMIN: 'Propietario / Administrador',
  PAYROLL_MANAGER: 'Encargado de nómina',
  GENERAL_MANAGER: 'Gerente general',
  BRANCH_MANAGER: 'Encargado de sucursal',
  CASHIER_RECORDER: 'Cajero / Registrador',
  EMPLOYEE_SELF_SERVICE: 'Empleado (autoservicio)',
};
