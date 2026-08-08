import { Calendar, ChevronDown } from 'lucide-react';
import { NotebookRings } from './NotebookRings';
import { MovementRow } from './MovementRow';
import { formatCentsToMXN } from '@/lib/utils/money';
import type { MockMovement } from '@/features/libreta/mockData';

interface NotebookShellProps {
  employeeFirstName: string;
  periodLabel: string;
  movements: MockMovement[];
  totalCents: number;
}

/**
 * Hoja de la libreta (referencia visual 1 y 3): papel con líneas sutiles,
 * argollas decorativas, borde azul lateral, título y total en tipografía
 * manuscrita (Patrick Hand) — nunca usada en montos por fila ni controles
 * (§4.4). Construida 100% con CSS/SVG, sin imagen de fondo.
 */
export function NotebookShell({ employeeFirstName, periodLabel, movements, totalCents }: NotebookShellProps) {
  return (
    <section className="relative rounded-card border border-line bg-surface p-6 shadow-control xl:min-h-[70vh]">
      <NotebookRings />

      {/* Borde azul lateral (§4.1) */}
      <div className="absolute top-6 bottom-6 left-0 w-1.5 rounded-full bg-gradient-to-b from-brand-500 to-brand-700 sm:left-1" />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 pl-3 sm:pl-4">
        <h2 className="relative font-hand text-2xl leading-none text-ink">
          Movimientos de {employeeFirstName}
          <span className="absolute -bottom-1 left-0 h-2 w-full -rotate-1 rounded-full bg-warning/40" />
        </h2>
        <button
          type="button"
          className="flex h-9 items-center gap-1.5 rounded-pill border border-line bg-surface-soft px-3.5 text-xs font-semibold text-ink hover:bg-line/40"
        >
          <Calendar size={14} className="text-brand-600" />
          {periodLabel}
          <ChevronDown size={14} className="text-muted" />
        </button>
      </div>

      <div
        className="pl-3 sm:pl-4"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent, transparent 47px, var(--line) 48px)',
        }}
      >
        <div className="grid grid-cols-[88px_1fr_100px_90px_84px_28px] gap-2 pb-2 text-xs font-semibold tracking-wide text-muted uppercase">
          <span>Fecha</span>
          <span>Concepto</span>
          <span>Tipo</span>
          <span className="text-right">Monto</span>
          <span>Registró</span>
          <span />
        </div>

        {movements.map((m) => (
          <MovementRow key={m.id} movement={m} />
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 pl-3 font-hand text-xl text-brand-700 sm:pl-4">
        Total del periodo
        <svg width="40" height="16" viewBox="0 0 40 16" fill="none" aria-hidden="true">
          <path d="M1 8h34M28 2l7 6-7 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="relative inline-block px-2">
          <svg
            className="absolute inset-0 -m-1 h-[calc(100%+8px)] w-[calc(100%+16px)] text-danger"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <ellipse cx="50" cy="20" rx="48" ry="17" fill="none" stroke="currentColor" strokeWidth="2.5" />
          </svg>
          <span className="relative">
            {totalCents >= 0 ? '-' : '+'}
            {formatCentsToMXN(Math.abs(totalCents))}
          </span>
        </span>
      </div>
    </section>
  );
}
