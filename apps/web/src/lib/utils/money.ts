/**
 * Utilidades de formato monetario. La app SIEMPRE opera en enteros de
 * centavos (amountCents); nunca convertir a float para cálculos, solo para
 * presentación final con Intl.NumberFormat.
 */
const MXN_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCentsToMXN(amountCents: number): string {
  return MXN_FORMATTER.format(amountCents / 100);
}

/**
 * Presenta el saldo pendiente siguiendo la regla de negocio (§6.1):
 * > 0 → "Pendiente por descontar", = 0 → "Sin saldo pendiente",
 * < 0 → "Saldo a favor". Nunca un número confuso como "-$-50".
 */
export function describeBalance(balanceCents: number): {
  label: string;
  amountLabel: string;
  tone: 'pending' | 'settled' | 'favor';
} {
  if (balanceCents > 0) {
    return {
      label: 'Pendiente por descontar',
      amountLabel: formatCentsToMXN(balanceCents),
      tone: 'pending',
    };
  }
  if (balanceCents === 0) {
    return { label: 'Sin saldo pendiente', amountLabel: formatCentsToMXN(0), tone: 'settled' };
  }
  return {
    label: 'Saldo a favor',
    amountLabel: formatCentsToMXN(Math.abs(balanceCents)),
    tone: 'favor',
  };
}
