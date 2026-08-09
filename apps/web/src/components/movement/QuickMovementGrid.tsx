import type { MovementCategoryView } from '@/features/configuracion/api';
import { resolveIcon } from '@/lib/utils/icons';
import { QuickMovementTile } from './QuickMovementTile';

interface QuickMovementGridProps {
  categories: MovementCategoryView[];
  onSelectCategory?: (categoryId: string) => void;
}

const TONE_BY_COLOR_TOKEN: Record<string, 'danger' | 'warning' | 'brand' | 'purple'> = {
  danger: 'danger',
  warning: 'warning',
  'brand-600': 'brand',
  'brand-800': 'brand',
  purple: 'purple',
  pink: 'purple',
  success: 'brand',
  muted: 'brand',
};

/**
 * Grid de accesos rápidos (§4.5, referencia visual 2): las 4 categorías con
 * `sortOrder` más bajo del catálogo real (`MovementCategoriesModule`, Fase
 * 3). `QuickMovementTile` solo soporta 4 tonos fijos por diseño — se mapean
 * los `colorToken` reales al tono visual más cercano.
 */
export function QuickMovementGrid({ categories, onSelectCategory }: QuickMovementGridProps) {
  const top4 = categories.slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-2">
      {top4.map((category) => (
        <QuickMovementTile
          key={category.id}
          label={category.label}
          icon={resolveIcon(category.iconName)}
          tone={TONE_BY_COLOR_TOKEN[category.colorToken] ?? 'brand'}
          onClick={() => onSelectCategory?.(category.id)}
        />
      ))}
    </div>
  );
}
