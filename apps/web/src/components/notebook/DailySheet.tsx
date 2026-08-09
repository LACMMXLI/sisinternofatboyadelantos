import { ArrowDownUp, NotebookPen, UserPlus } from 'lucide-react';
import { NotebookRings } from './NotebookRings';
import { DailyMovementCard, DailyMovementRow } from './DailyMovementRow';
import { formatCentsToMXN } from '@/lib/utils/money';
import type { MovementView } from '@/features/libreta/api';

interface DailySheetProps {
  movements: MovementView[];
  sortAsc: boolean;
  onToggleSort: () => void;
  onEmployeeClick: (employeeId: string) => void;
  netCents: number;
  hasEmployees: boolean;
  onEmptyCta: () => void;
}

/**
 * Hoja diaria (§2 de la corrección): superficie continua de trabajo con
 * aspecto de libreta real — reemplaza la vista centrada en un solo
 * empleado. Muestra en una sola hoja los movimientos de todos los
 * empleados del día seleccionado, ordenables cronológicamente.
 */
export function DailySheet({
  movements,
  sortAsc,
  onToggleSort,
  onEmployeeClick,
  netCents,
  hasEmployees,
  onEmptyCta,
}: DailySheetProps) {
  return (
    <section className="relative rounded-card border border-line bg-surface p-4 shadow-control">
      <NotebookRings />
      <div className="absolute top-4 bottom-4 left-0 w-1.5 rounded-full bg-gradient-to-b from-brand-500 to-brand-700 sm:left-1" />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 pl-3 sm:pl-4">
        <h2 className="font-hand text-xl leading-none text-ink">Hoja del día</h2>
        <button
          type="button"
          onClick={onToggleSort}
          className="flex h-8 items-center gap-1.5 rounded-pill border border-line bg-surface-soft px-3 text-xs font-semibold text-ink hover:bg-line/40"
        >
          <ArrowDownUp size={13} className="text-brand-600" />
          {sortAsc ? 'Más antiguo primero' : 'Más reciente primero'}
        </button>
      </div>

      {movements.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14 pl-3 text-center sm:pl-4">
          <p className="font-hand text-lg text-muted">No hay anotaciones para hoy.</p>
          {hasEmployees ? (
            <button
              type="button"
              onClick={onEmptyCta}
              className="flex h-10 items-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white shadow-control hover:brightness-105"
            >
              <NotebookPen size={16} /> Anotar primer movimiento
            </button>
          ) : (
            <a
              href="/app/empleados"
              className="flex h-10 items-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white shadow-control hover:brightness-105"
            >
              <UserPlus size={16} /> Registrar primer empleado
            </a>
          )}
        </div>
      ) : (
        <>
          {/* Escritorio/tablet: hoja tabular. Móvil: tarjetas (sin scroll horizontal). */}
          <div className="hidden pl-3 sm:pl-4 md:block">
            <div className="grid grid-cols-[64px_1fr_112px_1fr_84px_84px_92px_88px_32px] gap-2 pb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
              <span>Hora</span>
              <span>Empleado</span>
              <span>Categoría</span>
              <span>Concepto</span>
              <span className="text-right">Cargo</span>
              <span className="text-right">Abono</span>
              <span>Estado</span>
              <span>Registró</span>
              <span />
            </div>
            {movements.map((m) => (
              <DailyMovementRow key={m.id} movement={m} onEmployeeClick={onEmployeeClick} />
            ))}
          </div>

          <div className="space-y-2 pl-3 sm:pl-4 md:hidden">
            {movements.map((m) => (
              <DailyMovementCard key={m.id} movement={m} onEmployeeClick={onEmployeeClick} />
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3 pl-3 font-hand text-xl text-brand-700 sm:pl-4">
            Neto del día
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
                {netCents >= 0 ? '-' : '+'}
                {formatCentsToMXN(Math.abs(netCents))}
              </span>
            </span>
          </div>
        </>
      )}
    </section>
  );
}
