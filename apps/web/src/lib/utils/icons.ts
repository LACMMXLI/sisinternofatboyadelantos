import * as LucideIcons from 'lucide-react';
import { Tag, type LucideIcon } from 'lucide-react';

/**
 * Resuelve un nombre de icono guardado en la base de datos (`iconName` en
 * `MovementCategory`) al componente real de `lucide-react`. Si el nombre no
 * existe (dato viejo, typo manual), cae a `Tag` en vez de romper la UI.
 */
export function resolveIcon(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] ?? Tag;
}
