import { describeBalance } from '@/lib/utils/money';
import { avatarColorFor, initialsFrom } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils/cn';

export interface EmployeeListItemProps {
  displayName: string;
  jobTitle: string;
  balanceCents: number;
  active?: boolean;
  selected?: boolean;
  photoUrl?: string;
  onClick?: () => void;
}

/**
 * Fila de empleado en la columna izquierda (referencia visual: avatar con
 * indicador de actividad, nombre, puesto, saldo a la derecha en verde/rojo
 * según corresponda, resaltado azul suave cuando está seleccionado).
 */
export function EmployeeListItem({
  displayName,
  jobTitle,
  balanceCents,
  active = true,
  selected = false,
  photoUrl,
  onClick,
}: EmployeeListItemProps) {
  const balance = describeBalance(balanceCents);
  const avatarColor = avatarColorFor(displayName);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-2xl border p-2 text-left transition-colors',
        selected
          ? 'border-brand-500 bg-brand-600/10'
          : 'border-transparent hover:bg-surface-soft',
      )}
    >
      <div className="relative shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div
            className={cn(
              'grid h-10 w-10 place-items-center rounded-full text-sm font-bold',
              avatarColor.bg,
              avatarColor.text,
            )}
          >
            {initialsFrom(displayName)}
          </div>
        )}
        {active ? (
          <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-surface bg-success" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
        <p className="truncate text-xs text-muted">{jobTitle}</p>
      </div>

      <p
        className={cn(
          'shrink-0 text-sm font-semibold tabular-nums',
          balance.tone === 'pending' && 'text-danger',
          balance.tone === 'settled' && 'text-muted',
          balance.tone === 'favor' && 'text-success',
        )}
      >
        {balance.tone === 'pending' ? `-${balance.amountLabel}` : balance.amountLabel}
      </p>
    </button>
  );
}
