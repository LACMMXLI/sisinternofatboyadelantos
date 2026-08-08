import { clsx, type ClassValue } from 'clsx';

/**
 * Combina clases condicionalmente. Wrapper delgado sobre clsx; se deja como
 * utilidad propia para poder añadir tailwind-merge más adelante si el
 * proyecto lo necesita de verdad (evitar dependencia hasta que sea necesaria).
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
