/**
 * Datos de EJEMPLO para el prototipo visual de la Fase 4 (adelantado a
 * pedido del usuario para validar el parecido con las referencias antes de
 * seguir con más backend). Nombres ficticios, distintos de los usados en
 * las imágenes de referencia (§17: no copiar nombres/fotos reales de las
 * imágenes). Se reemplaza por datos reales de la API en la Fase 3/4.
 */
import type { MovementDirection } from '@libreta/shared';

export interface MockEmployee {
  id: string;
  displayName: string;
  jobTitle: string;
  balanceCents: number;
  active: boolean;
}

// Nota de signo (§6.1): balanceCents POSITIVO = pendiente por descontar
// (deuda, se muestra en rojo con "-"); NEGATIVO = saldo a favor (verde);
// 0 = sin saldo pendiente. Mismo criterio que `describeBalance()`.
export const MOCK_EMPLOYEES: MockEmployee[] = [
  { id: '1', displayName: 'Renata Cifuentes', jobTitle: 'Operaria', balanceCents: 23000, active: true },
  { id: '2', displayName: 'Marco Delgado', jobTitle: 'Empaque', balanceCents: 12000, active: true },
  { id: '3', displayName: 'Iván Ortiz', jobTitle: 'Almacén', balanceCents: 0, active: true },
  { id: '4', displayName: 'Paola Reséndiz', jobTitle: 'Producción', balanceCents: 8000, active: true },
  { id: '5', displayName: 'Héctor Villaseñor', jobTitle: 'Mantenimiento', balanceCents: 45000, active: true },
  { id: '6', displayName: 'Daniela Ponce', jobTitle: 'Operaria', balanceCents: -5000, active: true },
  { id: '7', displayName: 'Emilio Castañeda', jobTitle: 'Empaque', balanceCents: 3000, active: true },
  { id: '8', displayName: 'Ximena Rosales', jobTitle: 'Almacén', balanceCents: 0, active: true },
];

export interface MockMovement {
  id: string;
  dateLabel: string;
  timeLabel: string;
  concept: string;
  categoryLabel: string;
  categoryColor: 'danger' | 'warning' | 'purple';
  direction: MovementDirection;
  amountCents: number;
  registeredBy: string;
}

export const MOCK_MOVEMENTS: MockMovement[] = [
  { id: 'm1', dateLabel: '08/Ago', timeLabel: '09:15', concept: 'Adelanto', categoryLabel: 'Adelanto', categoryColor: 'danger', direction: 'CHARGE', amountCents: 20000, registeredBy: 'Alonso' },
  { id: 'm2', dateLabel: '08/Ago', timeLabel: '12:30', concept: 'Comida', categoryLabel: 'Consumo', categoryColor: 'warning', direction: 'CHARGE', amountCents: 8000, registeredBy: 'Alonso' },
  { id: 'm3', dateLabel: '07/Ago', timeLabel: '16:40', concept: 'Soda', categoryLabel: 'Consumo', categoryColor: 'warning', direction: 'CHARGE', amountCents: 3000, registeredBy: 'Alonso' },
  { id: 'm4', dateLabel: '06/Ago', timeLabel: '11:00', concept: 'Adelanto', categoryLabel: 'Adelanto', categoryColor: 'danger', direction: 'CHARGE', amountCents: 15000, registeredBy: 'Alonso' },
  { id: 'm5', dateLabel: '06/Ago', timeLabel: '15:20', concept: 'Otras desc.', categoryLabel: 'Descuento', categoryColor: 'purple', direction: 'CHARGE', amountCents: 2000, registeredBy: 'Alonso' },
  { id: 'm6', dateLabel: '05/Ago', timeLabel: '10:05', concept: 'Comida', categoryLabel: 'Consumo', categoryColor: 'warning', direction: 'CHARGE', amountCents: 8000, registeredBy: 'Alonso' },
];

/** Positivo = total de cargos de la semana (mismo criterio que balanceCents). */
export const MOCK_WEEK_TOTAL_CENTS = 58000;

export const MOCK_BREAKDOWN = [
  { label: 'Adelantos', amountCents: 35000, colorVar: 'var(--danger)', percent: 60 },
  { label: 'Consumos', amountCents: 21000, colorVar: 'var(--warning)', percent: 36 },
  { label: 'Descuentos', amountCents: 2000, colorVar: 'var(--purple)', percent: 4 },
];

export const MOCK_RECENT_ACTIVITY = [
  { id: 'a1', timeLabel: '11:20', label: 'Adelanto', amountCents: 10000, iconColor: 'danger' as const },
  { id: 'a2', timeLabel: '10:45', label: 'Comida', amountCents: 8000, iconColor: 'warning' as const },
  { id: 'a3', timeLabel: '09:15', label: 'Soda', amountCents: 2500, iconColor: 'warning' as const },
];
