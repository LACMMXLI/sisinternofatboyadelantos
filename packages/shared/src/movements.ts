/**
 * Vocabulario del ledger (§6). Direcciones, estados y catálogo inicial de
 * categorías. El backend es la fuente de verdad de las categorías reales
 * (tabla MovementCategory); esta lista solo documenta las claves "system"
 * iniciales usadas por el seed y por los iconos/colores por defecto del UI.
 */
export type MovementDirection = 'CHARGE' | 'CREDIT';

export const MOVEMENT_STATUSES = [
  'PENDING_APPROVAL',
  'POSTED',
  'REVERSED',
  'REJECTED',
] as const;
export type MovementStatus = (typeof MOVEMENT_STATUSES)[number];

export const MOVEMENT_SOURCES = ['WEB', 'PWA_OFFLINE', 'PAYROLL', 'IMPORT', 'SYSTEM'] as const;
export type MovementSource = (typeof MOVEMENT_SOURCES)[number];

export interface MovementCategorySeed {
  code: string;
  label: string;
  direction: MovementDirection;
  colorToken:
    | 'success'
    | 'danger'
    | 'warning'
    | 'purple'
    | 'pink'
    | 'brand-600'
    | 'brand-800'
    | 'muted';
  iconName: string;
}

export const SYSTEM_MOVEMENT_CATEGORIES: readonly MovementCategorySeed[] = [
  { code: 'CASH_ADVANCE', label: 'Adelanto', direction: 'CHARGE', colorToken: 'danger', iconName: 'HandCoins' },
  { code: 'FOOD', label: 'Comida', direction: 'CHARGE', colorToken: 'warning', iconName: 'UtensilsCrossed' },
  { code: 'BEVERAGE', label: 'Soda / bebida', direction: 'CHARGE', colorToken: 'brand-600', iconName: 'CupSoda' },
  { code: 'SNACK', label: 'Snack', direction: 'CHARGE', colorToken: 'warning', iconName: 'Cookie' },
  { code: 'TRANSPORT', label: 'Transporte', direction: 'CHARGE', colorToken: 'purple', iconName: 'Bus' },
  { code: 'OTHER_DEDUCTION', label: 'Otro descuento', direction: 'CHARGE', colorToken: 'pink', iconName: 'Tag' },
  { code: 'CASH_REPAYMENT', label: 'Devolución en efectivo', direction: 'CREDIT', colorToken: 'success', iconName: 'Undo2' },
  { code: 'PAYROLL_DEDUCTION', label: 'Aplicado en nómina', direction: 'CREDIT', colorToken: 'brand-800', iconName: 'Receipt' },
  { code: 'DEBIT_ADJUSTMENT', label: 'Ajuste de cargo', direction: 'CHARGE', colorToken: 'danger', iconName: 'PlusCircle' },
  { code: 'CREDIT_ADJUSTMENT', label: 'Ajuste a favor', direction: 'CREDIT', colorToken: 'success', iconName: 'MinusCircle' },
  { code: 'OPENING_BALANCE', label: 'Saldo inicial', direction: 'CHARGE', colorToken: 'muted', iconName: 'FileClock' },
] as const;
