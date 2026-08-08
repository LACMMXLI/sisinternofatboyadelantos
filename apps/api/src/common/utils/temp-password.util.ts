import { randomInt } from 'node:crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/**
 * Genera una contraseña temporal legible (sin caracteres ambiguos como 0/O,
 * 1/l/I). Se muestra UNA vez a quien administra y nunca se persiste en
 * texto plano — solo su hash Argon2id.
 */
export function generateTempPassword(length = 12): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(ALPHABET.length)];
  }
  return out;
}
