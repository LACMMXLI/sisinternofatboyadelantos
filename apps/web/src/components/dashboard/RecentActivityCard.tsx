import { Clock, CupSoda, HandCoins, UtensilsCrossed } from 'lucide-react';
import { formatCentsToMXN } from '@/lib/utils/money';
import { cn } from '@/lib/utils/cn';
import type { MOCK_RECENT_ACTIVITY } from '@/features/libreta/mockData';

const ICONS = { danger: HandCoins, warning: UtensilsCrossed, brand: CupSoda } as const;
const TONE_BG = { danger: 'bg-danger-soft text-danger', warning: 'bg-warning-soft text-warning', brand: 'bg-brand-600/10 text-brand-600' };

interface RecentActivityCardProps {
  items: (typeof MOCK_RECENT_ACTIVITY)[number][];
}

export function RecentActivityCard({ items }: RecentActivityCardProps) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-control">
      <div className="mb-2 flex items-center gap-2">
        <Clock size={16} className="text-brand-600" />
        <h3 className="text-sm font-bold text-ink">Actividad Reciente (Hoy)</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const Icon = ICONS[item.iconColor] ?? HandCoins;
          return (
            <li key={item.id} className="flex items-center gap-3 text-sm">
              <span className="w-11 shrink-0 text-xs text-muted">{item.timeLabel}</span>
              <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full', TONE_BG[item.iconColor])}>
                <Icon size={15} />
              </span>
              <span className="flex-1 truncate font-medium text-ink">{item.label}</span>
              <span className="font-semibold text-danger tabular-nums">
                -{formatCentsToMXN(item.amountCents)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
