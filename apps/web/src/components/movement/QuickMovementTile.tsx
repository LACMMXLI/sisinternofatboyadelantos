import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface QuickMovementTileProps {
  label: string;
  icon: LucideIcon;
  tone: 'danger' | 'warning' | 'brand' | 'purple';
  onClick?: () => void;
}

const TONE_STYLES: Record<QuickMovementTileProps['tone'], { bg: string; icon: string; underline: string }> = {
  danger: { bg: 'bg-danger-soft', icon: 'text-danger', underline: 'bg-danger' },
  warning: { bg: 'bg-warning-soft', icon: 'text-warning', underline: 'bg-warning' },
  brand: { bg: 'bg-brand-600/10', icon: 'text-brand-600', underline: 'bg-brand-600' },
  purple: { bg: 'bg-purple-soft', icon: 'text-purple', underline: 'bg-purple' },
};

/**
 * Mosaico grande de acceso rápido (§4.5, referencia visual 2): icono +
 * etiqueta + acento de color inferior. Objetivo táctil ≥ 48px de alto.
 */
export function QuickMovementTile({ label, icon: Icon, tone, onClick }: QuickMovementTileProps) {
  const styles = TONE_STYLES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-[72px] flex-col items-center justify-center gap-1 rounded-card transition hover:brightness-[0.97] active:scale-[0.98]',
        styles.bg,
      )}
    >
      <Icon size={24} className={styles.icon} />
      <span className="text-sm font-semibold text-ink">{label}</span>
      <span className={cn('h-1 w-8 rounded-full', styles.underline)} />
    </button>
  );
}
