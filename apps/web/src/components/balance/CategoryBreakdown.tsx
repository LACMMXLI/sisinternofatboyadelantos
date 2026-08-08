import { formatCentsToMXN } from '@/lib/utils/money';

interface BreakdownItem {
  label: string;
  amountCents: number;
  colorVar: string;
  percent?: number;
}

/**
 * Desglose por categoría con marcador de color + etiqueta + monto (§4.5).
 * Acompaña siempre al color con texto — nunca depende solo del color.
 */
export function CategoryBreakdown({ items }: { items: BreakdownItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-ink">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.colorVar }}
              aria-hidden="true"
            />
            {item.label}
            {item.percent !== undefined ? (
              <span className="text-xs text-muted">{item.percent}%</span>
            ) : null}
          </span>
          <span className="font-semibold text-danger tabular-nums">
            -{formatCentsToMXN(item.amountCents)}
          </span>
        </li>
      ))}
    </ul>
  );
}
