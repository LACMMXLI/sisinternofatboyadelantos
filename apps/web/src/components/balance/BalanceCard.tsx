import { AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { describeBalance, formatCentsToMXN } from '@/lib/utils/money';
import { CategoryBreakdown } from './CategoryBreakdown';

interface BalanceCardProps {
  balanceCents: number;
  breakdown: { label: string; amountCents: number; colorVar: string; percent?: number }[];
  /** Sueldo por periodo de nómina del empleado (centavos), si está capturado. */
  baseSalaryCents?: number | null;
}

/**
 * Panel de saldo (§4.5, referencia visual 1): saldo grande, barra de
 * progreso, desglose por categoría, aviso de que se descuenta en nómina.
 * Sigue exactamente la regla de presentación del saldo (§6.1).
 *
 * Sueldo/neto estimado (corrección 2026-08-09): cuando el empleado tiene
 * `baseSalaryCents`, se muestra "sueldo − saldo pendiente = neto estimado"
 * — una resta simple, rotulada como estimado, nunca como cálculo fiscal
 * (ISR/IMSS siguen fuera de alcance). Si el saldo ya supera el sueldo, se
 * marca en rojo como advertencia visible, sin bloquear nada desde aquí.
 */
export function BalanceCard({ balanceCents, breakdown, baseSalaryCents }: BalanceCardProps) {
  const balance = describeBalance(balanceCents);
  const maxCents = Math.max(...breakdown.map((b) => b.amountCents), 1);
  const progressPercent = Math.min(100, (Math.abs(balanceCents) / (maxCents * 1.6)) * 100);

  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-control">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Saldo Actual</p>
        <TrendingUp size={16} className="text-brand-600" />
      </div>
      <p
        className={
          balance.tone === 'pending'
            ? 'text-[28px] font-extrabold text-danger'
            : balance.tone === 'favor'
              ? 'text-[28px] font-extrabold text-success'
              : 'text-[28px] font-extrabold text-ink'
        }
      >
        {balance.tone === 'pending' ? '-' : ''}
        {balance.amountLabel}
      </p>
      <p className="mb-2 text-xs text-muted">{balance.label}</p>

      {balance.tone === 'pending' ? (
        <div className="mb-3 h-2 w-full overflow-hidden rounded-pill bg-line">
          <div
            className="h-full rounded-pill bg-gradient-to-r from-danger to-warning"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      ) : null}

      <CategoryBreakdown items={breakdown} />

      {balance.tone === 'pending' ? (
        <div className="mt-3 flex items-start gap-2 rounded-control bg-brand-600/8 px-3 py-2 text-xs text-brand-700">
          <Info size={15} className="mt-0.5 shrink-0" />
          Este saldo se descontará en la próxima nómina.
        </div>
      ) : null}

      {baseSalaryCents != null ? (
        <>
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
            <span className="text-muted">Sueldo del periodo</span>
            <span className="font-semibold tabular-nums text-ink">{formatCentsToMXN(baseSalaryCents)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted">Neto estimado</span>
            <span
              className={
                baseSalaryCents - balanceCents < 0
                  ? 'font-bold tabular-nums text-danger'
                  : 'font-bold tabular-nums text-success'
              }
            >
              {formatCentsToMXN(baseSalaryCents - balanceCents)}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted">Estimado (sueldo − saldo pendiente): no calcula ISR ni IMSS.</p>

          {balanceCents > baseSalaryCents ? (
            <div className="mt-2 flex items-start gap-2 rounded-control bg-danger-soft px-3 py-2 text-xs text-danger">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              Los adelantos/consumos ya superan el sueldo del periodo.
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
