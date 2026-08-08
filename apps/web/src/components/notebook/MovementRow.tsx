import { MoreVertical } from 'lucide-react';
import { formatCentsToMXN } from '@/lib/utils/money';
import { cn } from '@/lib/utils/cn';
import type { MockMovement } from '@/features/libreta/mockData';

const PILL_STYLES: Record<MockMovement['categoryColor'], string> = {
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  purple: 'bg-purple-soft text-purple',
};

/**
 * Fila de movimiento dentro de la hoja de la libreta (referencia visual 1):
 * fecha/hora, concepto, categoría en píldora de color, monto y quién
 * registró. El color nunca es el único indicador de dirección (§14): el
 * signo "-"/"+" siempre acompaña al monto.
 */
export function MovementRow({ movement }: { movement: MockMovement }) {
  const isCharge = movement.direction === 'CHARGE';
  return (
    <div className="grid grid-cols-[88px_1fr_100px_90px_84px_28px] items-center gap-2 border-b border-line/70 py-3 text-sm last:border-b-0">
      <div className="text-muted">
        <span className="font-medium text-ink">{movement.dateLabel}</span>{' '}
        <span className="text-xs">{movement.timeLabel}</span>
      </div>
      <div className="truncate font-medium text-ink">{movement.concept}</div>
      <div>
        <span
          className={cn(
            'inline-block rounded-pill px-2.5 py-1 text-xs font-semibold',
            PILL_STYLES[movement.categoryColor],
          )}
        >
          {movement.categoryLabel}
        </span>
      </div>
      <div className={cn('text-right font-semibold tabular-nums', isCharge ? 'text-danger' : 'text-success')}>
        {isCharge ? '-' : '+'}
        {formatCentsToMXN(movement.amountCents)}
      </div>
      <div className="truncate text-xs text-muted">{movement.registeredBy}</div>
      <button
        type="button"
        className="grid h-7 w-7 place-items-center justify-self-end rounded-control text-muted hover:bg-surface-soft hover:text-ink"
        aria-label="Más opciones"
      >
        <MoreVertical size={15} />
      </button>
    </div>
  );
}
