import { describeBalance } from '@/lib/utils/money';
import { avatarColorFor, initialsFrom } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils/cn';

export interface EmployeeCardProps {
  displayName: string;
  jobTitle: string;
  balanceCents: number;
  selected?: boolean;
  photoUrl?: string;
  onClick?: () => void;
}

/**
 * EmployeeCard — Tarjeta grande de empleado (Grid layout).
 * Sistema Stitch: 24px border radius, sombra dinámica, escala al hover.
 *
 * Usa:
 * - Imagen circular 160px
 * - Nombre grande (headline-lg)
 * - Status badge con icono (Cocina, Caja, Mesero, etc.)
 * - Sombra y animaciones suaves
 */
export function EmployeeCard({
  displayName,
  jobTitle,
  balanceCents,
  selected = false,
  photoUrl,
  onClick,
}: EmployeeCardProps) {
  const balance = describeBalance(balanceCents);
  const avatarColor = avatarColorFor(displayName);

  // Mapear job titles a iconos y colores
  const getJobBadge = (job: string) => {
    switch (job.toLowerCase()) {
      case 'cocina':
      case 'cook':
      case 'kitchen':
        return {
          icon: '🍳',
          label: 'Cocina',
          bgColor: 'bg-yellow-600',
          textColor: 'text-white',
        };
      case 'caja':
      case 'cash':
      case 'cashier':
        return {
          icon: '🛒',
          label: 'Caja',
          bgColor: 'bg-surface-soft',
          textColor: 'text-ink border border-muted',
        };
      case 'mesero':
      case 'waiter':
      case 'server':
        return {
          icon: '🍽️',
          label: 'Mesero',
          bgColor: 'bg-surface-soft',
          textColor: 'text-ink border border-muted',
        };
      default:
        return {
          icon: '👤',
          label: job,
          bgColor: 'bg-surface-soft',
          textColor: 'text-ink border border-muted',
        };
    }
  };

  const badge = getJobBadge(jobTitle);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'bg-surface-soft rounded-[24px] p-8 shadow-control border border-muted flex flex-col items-center',
        'hover:scale-102 hover:shadow-panel transition-all duration-200 group text-left w-full',
        'focus:outline-none focus:ring-4 focus:ring-brand-600 relative',
        selected && 'ring-4 ring-brand-600'
      )}
    >
      {/* Avatar - Circular image 160px */}
      <div className="w-40 h-40 rounded-full overflow-hidden mb-6 border-4 border-surface shadow-inner relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className={cn(
              'w-full h-full flex items-center justify-center text-4xl font-bold',
              avatarColor.bg,
              avatarColor.text,
            )}
          >
            {initialsFrom(displayName)}
          </div>
        )}
      </div>

      {/* Name - headline-lg */}
      <h2 className="text-headline-lg text-ink mb-4 group-hover:text-brand-600 transition-colors font-semibold">
        {displayName.toUpperCase()}
      </h2>

      {/* Job Badge */}
      <div className={cn('px-6 py-2 rounded-full flex items-center gap-2', badge.bgColor, badge.textColor)}>
        <span className="text-[20px]">{badge.icon}</span>
        <span className="font-label-bold text-xs tracking-wide">{badge.label}</span>
      </div>

      {/* Balance (optional, displayed below badge) */}
      {balanceCents !== 0 && (
        <div className="mt-4 text-sm font-semibold tabular-nums">
          {balance.tone === 'pending' && <span className="text-danger">-${balance.amountLabel}</span>}
          {balance.tone === 'settled' && <span className="text-muted">Saldado</span>}
          {balance.tone === 'favor' && <span className="text-success">+${balance.amountLabel}</span>}
        </div>
      )}
    </button>
  );
}
