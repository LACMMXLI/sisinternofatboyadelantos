import type { MovementStatus } from '@libreta/shared';

export const STATUS_LABELS: Record<MovementStatus, string> = {
  PENDING_APPROVAL: 'Pendiente',
  POSTED: 'Registrado',
  REVERSED: 'Revertido',
  REJECTED: 'Rechazado',
};

export const STATUS_PILL_CLASSES: Record<MovementStatus, string> = {
  PENDING_APPROVAL: 'bg-warning-soft text-warning',
  POSTED: 'bg-success-soft text-success',
  REVERSED: 'bg-line text-muted',
  REJECTED: 'bg-danger-soft text-danger',
};
