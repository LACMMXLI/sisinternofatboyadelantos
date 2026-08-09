import { Clock } from 'lucide-react';
import { formatCentsToMXN } from '@/lib/utils/money';
import { resolveIcon } from '@/lib/utils/icons';
import { categoryColorStyles } from '@/lib/utils/categoryColors';
import { cn } from '@/lib/utils/cn';

export interface RecentActivityItem {
  id: string;
  timeLabel: string;
  label: string;
  amountCents: number;
  iconName: string;
  colorToken: string;
}

interface RecentActivityCardProps {
  items: RecentActivityItem[];
}

export function RecentActivityCard({ items }: RecentActivityCardProps) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-control">
      <div className="mb-2 flex items-center gap-2">
        <Clock size={16} className="text-brand-600" />
        <h3 className="text-sm font-bold text-ink">Actividad Reciente (Hoy)</h3>
      </div>
      {items.length === 0 ? (
        <p className="py-2 text-sm text-muted">Sin movimientos hoy.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const Icon = resolveIcon(item.iconName);
            const styles = categoryColorStyles(item.colorToken);
            return (
              <li key={item.id} className="flex items-center gap-3 text-sm">
                <span className="w-11 shrink-0 text-xs text-muted">{item.timeLabel}</span>
                <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full', styles.bg, styles.text)}>
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
      )}
    </div>
  );
}
