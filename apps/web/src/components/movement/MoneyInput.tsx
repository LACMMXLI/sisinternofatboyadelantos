import { useState } from 'react';

interface MoneyInputProps {
  id?: string;
  valueCents: number;
  onChangeCents: (cents: number) => void;
  autoFocus?: boolean;
}

/**
 * Captura un monto en pesos (lo que el usuario espera escribir) y lo
 * convierte a centavos enteros para el resto de la app (§ dinero: nunca
 * float en cálculos, `amountCents` siempre). El texto en pantalla es la
 * única fuente "en pesos"; todo lo demás opera en centavos.
 */
export function MoneyInput({ id, valueCents, onChangeCents, autoFocus }: MoneyInputProps) {
  const [text, setText] = useState(valueCents > 0 ? (valueCents / 100).toString() : '');

  const handleChange = (raw: string) => {
    // Permite dígitos y un solo punto decimal; todo lo demás se descarta.
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const normalized = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : cleaned;
    setText(normalized);
    const parsed = Number.parseFloat(normalized);
    onChangeCents(Number.isFinite(parsed) ? Math.round(parsed * 100) : 0);
  };

  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-muted">
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="0.00"
        className="h-14 w-full rounded-control border border-line bg-surface-soft pl-7 pr-3.5 text-2xl font-bold tabular-nums text-ink outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
      />
    </div>
  );
}
