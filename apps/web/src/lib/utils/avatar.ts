/**
 * Iniciales + color de fondo determinístico para empleados/usuarios sin
 * foto (§4.4: "si no existe foto, mostrar iniciales sobre un fondo de
 * color. No inventar rostros generados.").
 */
const AVATAR_PALETTE = [
  { bg: 'bg-brand-600/15', text: 'text-brand-700' },
  { bg: 'bg-success-soft', text: 'text-success' },
  { bg: 'bg-warning-soft', text: 'text-warning' },
  { bg: 'bg-purple/15', text: 'text-purple' },
  { bg: 'bg-pink/15', text: 'text-pink' },
  { bg: 'bg-danger-soft', text: 'text-danger' },
] as const;

export function initialsFrom(name: string): string {
  const letters = name.match(/\p{L}+/gu) ?? [];
  return (
    letters
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

export function avatarColorFor(seed: string): (typeof AVATAR_PALETTE)[number] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
