/**
 * Tokens de color para categorías de movimiento (§8, `MovementCategorySeed`
 * en `@libreta/shared`). Las clases deben existir literalmente en el código
 * fuente para que Tailwind no las purgue — de ahí el mapa estático en vez de
 * construir el nombre de clase dinámicamente.
 */
export const CATEGORY_COLOR_TOKENS = [
  'success',
  'danger',
  'warning',
  'purple',
  'pink',
  'brand-600',
  'brand-800',
  'muted',
] as const;

export type CategoryColorToken = (typeof CATEGORY_COLOR_TOKENS)[number];

const STYLES: Record<CategoryColorToken, { bg: string; text: string }> = {
  success: { bg: 'bg-success-soft', text: 'text-success' },
  danger: { bg: 'bg-danger-soft', text: 'text-danger' },
  warning: { bg: 'bg-warning-soft', text: 'text-warning' },
  purple: { bg: 'bg-purple-soft', text: 'text-purple' },
  pink: { bg: 'bg-pink-soft', text: 'text-pink' },
  'brand-600': { bg: 'bg-brand-600/10', text: 'text-brand-600' },
  'brand-800': { bg: 'bg-brand-800/10', text: 'text-brand-800' },
  muted: { bg: 'bg-line', text: 'text-muted' },
};

const FALLBACK = STYLES.muted;

export function categoryColorStyles(token: string): { bg: string; text: string } {
  return STYLES[token as CategoryColorToken] ?? FALLBACK;
}
