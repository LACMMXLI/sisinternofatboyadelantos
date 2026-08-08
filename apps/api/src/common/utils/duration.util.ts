/**
 * Convierte duraciones simples ("15m", "30d", "45s", "2h") a milisegundos.
 * Evita una dependencia externa solo para esto.
 */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)\s*(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Duración inválida: "${value}". Usa un formato como "15m" o "30d".`,
    );
  }
  const amount = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * unitMs[unit];
}
