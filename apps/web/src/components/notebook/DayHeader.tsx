import { ChevronLeft, ChevronRight, CalendarDays, Building2, Clock3, AlertCircle } from 'lucide-react';
import { formatCentsToMXN } from '@/lib/utils/money';
import type { BranchView } from '@/features/configuracion/api';
import { cn } from '@/lib/utils/cn';

interface DayStats {
  count: number;
  chargeCents: number;
  creditCents: number;
  pendingCount: number;
}

interface DayHeaderProps {
  dateKey: string;
  dateLabel: string;
  isToday: boolean;
  onPrevDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  onPickDate: (dateKey: string) => void;
  branches: BranchView[];
  branchId: string | undefined;
  onBranchChange: (branchId: string) => void;
  stats: DayStats;
}

/**
 * Encabezado de la hoja del día (§1 de la corrección): comunica de
 * inmediato qué día se ve, qué sucursal está activa y qué se ha anotado
 * hoy. Todo integrado en el encabezado de la hoja — no una fila aparte de
 * tarjetas de dashboard.
 */
export function DayHeader({
  dateKey,
  dateLabel,
  isToday,
  onPrevDay,
  onNextDay,
  onToday,
  onPickDate,
  branches,
  branchId,
  onBranchChange,
  stats,
}: DayHeaderProps) {
  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-control">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-hand text-2xl leading-none text-brand-700">Libreta del día</p>
          <p className="mt-1 text-sm font-semibold text-ink">{dateLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {branches.length > 1 ? (
            <label className="relative">
              <span className="sr-only">Sucursal</span>
              <Building2 size={14} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted" />
              <select
                value={branchId ?? ''}
                onChange={(e) => onBranchChange(e.target.value)}
                className="h-10 rounded-control border border-line bg-surface-soft py-0 pr-3 pl-8 text-sm font-medium text-ink outline-none focus-visible:border-brand-500"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="flex items-center gap-1 rounded-control border border-line bg-surface-soft p-1">
            <button
              type="button"
              onClick={onPrevDay}
              aria-label="Día anterior"
              className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-surface hover:text-ink"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={onToday}
              disabled={isToday}
              className={cn(
                'h-8 rounded-[10px] px-3 text-xs font-bold',
                isToday ? 'bg-brand-600 text-white' : 'text-ink hover:bg-surface',
              )}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={onNextDay}
              aria-label="Día siguiente"
              className="grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-surface hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>
            <label className="relative grid h-8 w-8 place-items-center rounded-[10px] text-muted hover:bg-surface hover:text-ink">
              <span className="sr-only">Elegir fecha</span>
              <CalendarDays size={16} className="pointer-events-none" />
              <input
                type="date"
                value={dateKey}
                onChange={(e) => e.target.value && onPickDate(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-line pt-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted">
          <Clock3 size={14} /> {stats.count} {stats.count === 1 ? 'anotación' : 'anotaciones'}
        </span>
        <span className="font-semibold text-danger">Cargos: {formatCentsToMXN(stats.chargeCents)}</span>
        <span className="font-semibold text-success">Abonos: {formatCentsToMXN(stats.creditCents)}</span>
        {stats.pendingCount > 0 ? (
          <span className="flex items-center gap-1.5 rounded-pill bg-warning-soft px-2.5 py-0.5 text-xs font-bold text-warning">
            <AlertCircle size={13} /> {stats.pendingCount} pendiente{stats.pendingCount === 1 ? '' : 's'} de aprobación
          </span>
        ) : null}
      </div>
    </section>
  );
}
