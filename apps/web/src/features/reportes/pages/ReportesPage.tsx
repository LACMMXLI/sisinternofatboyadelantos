import { useState } from 'react';
import { BarChart3, Download } from 'lucide-react';
import type { MovementStatus } from '@libreta/shared';
import { useBalancesReport, useExportMovementsCsv, useMovementsReport, type ReportFilters } from '../api';
import { useBranches } from '@/features/configuracion/api';
import { useEmployees } from '@/features/empleados/api';
import { useMovementCategories } from '@/features/configuracion/api';
import { formatCentsToMXN } from '@/lib/utils/money';
import { cn } from '@/lib/utils/cn';

type Tab = 'movimientos' | 'saldos';

const STATUS_LABELS: Record<MovementStatus, string> = {
  PENDING_APPROVAL: 'Pendiente',
  POSTED: 'Aplicado',
  REVERSED: 'Revertido',
  REJECTED: 'Rechazado',
};

const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Reportes (Fase 8): movimientos filtrados con totales, saldos por
 * empleado, exportación CSV — mismo alcance por sucursal que el resto del
 * sistema (§5). No calcula nómina; solo reporta lo que ya existe en el
 * ledger.
 */
export function ReportesPage() {
  const [tab, setTab] = useState<Tab>('movimientos');
  const [filters, setFilters] = useState<ReportFilters>({});

  const { data: branches } = useBranches();
  const { data: employees } = useEmployees({ active: true });
  const { data: categories } = useMovementCategories(true);

  const { data: report, isLoading } = useMovementsReport(filters);
  const { data: balances, isLoading: balancesLoading } = useBalancesReport(filters.branchId);
  const exportCsv = useExportMovementsCsv();

  const setFilter = (key: keyof ReportFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value || undefined }));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple/10 text-purple">
            <BarChart3 size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink">Reportes</h1>
            <p className="text-sm text-muted">Saldos, movimientos y exportaciones.</p>
          </div>
        </div>
        <div className="flex gap-1.5 rounded-control border border-line bg-surface p-1">
          {(['movimientos', 'saldos'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'rounded-control px-3 py-1.5 text-sm font-semibold capitalize',
                tab === t ? 'bg-brand-600 text-white' : 'text-muted hover:bg-surface-soft',
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 rounded-card border border-line bg-surface p-4 shadow-control sm:grid-cols-3 lg:grid-cols-5">
        <select
          value={filters.branchId ?? ''}
          onChange={(e) => setFilter('branchId', e.target.value)}
          className="h-10 rounded-control border border-line bg-surface-soft px-2.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          <option value="">Todas las sucursales</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={filters.employeeId ?? ''}
          onChange={(e) => setFilter('employeeId', e.target.value)}
          className="h-10 rounded-control border border-line bg-surface-soft px-2.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          <option value="">Todos los empleados</option>
          {employees?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.displayName}
            </option>
          ))}
        </select>
        {tab === 'movimientos' ? (
          <>
            <select
              value={filters.categoryId ?? ''}
              onChange={(e) => setFilter('categoryId', e.target.value)}
              className="h-10 rounded-control border border-line bg-surface-soft px-2.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              <option value="">Todas las categorías</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={filters.status ?? ''}
              onChange={(e) => setFilter('status', e.target.value)}
              className="h-10 rounded-control border border-line bg-surface-soft px-2.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={filters.from?.slice(0, 10) ?? ''}
              onChange={(e) => setFilter('from', e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="h-10 rounded-control border border-line bg-surface-soft px-2.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            />
          </>
        ) : null}
      </div>

      {tab === 'movimientos' ? (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-card border border-line bg-surface p-4 shadow-control">
              <p className="text-xs font-semibold text-muted uppercase">Cargos</p>
              <p className="text-xl font-extrabold text-danger">{formatCentsToMXN(report?.totals.chargeCents ?? 0)}</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-4 shadow-control">
              <p className="text-xs font-semibold text-muted uppercase">Abonos</p>
              <p className="text-xl font-extrabold text-success">{formatCentsToMXN(report?.totals.creditCents ?? 0)}</p>
            </div>
            <div className="rounded-card border border-line bg-surface p-4 shadow-control">
              <p className="text-xs font-semibold text-muted uppercase">Neto</p>
              <p className="text-xl font-extrabold text-ink">{formatCentsToMXN(report?.totals.netCents ?? 0)}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void exportCsv.mutateAsync(filters)}
              disabled={exportCsv.isPending || (report?.items.length ?? 0) === 0}
              className="flex h-10 items-center gap-1.5 rounded-control border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-soft disabled:opacity-60"
            >
              <Download size={15} /> {exportCsv.isPending ? 'Generando…' : 'Exportar CSV'}
            </button>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted">Cargando…</p>
          ) : report?.items.length === 0 ? (
            <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-muted">
              No hay movimientos que coincidan con los filtros.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-card border border-line bg-surface shadow-control">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs font-semibold tracking-wide text-muted uppercase">
                    <th className="px-4 py-2.5">Fecha</th>
                    <th className="px-4 py-2.5">Empleado</th>
                    <th className="px-4 py-2.5">Categoría</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.items.map((m) => (
                    <tr key={m.id} className="border-b border-line/70 last:border-b-0">
                      <td className="px-4 py-2.5 text-muted">{DATE_FORMAT.format(new Date(m.occurredAt))}</td>
                      <td className="px-4 py-2.5 font-medium text-ink">{m.employee.displayName}</td>
                      <td className="px-4 py-2.5 text-ink">{m.category.label}</td>
                      <td className="px-4 py-2.5 text-muted">{STATUS_LABELS[m.status]}</td>
                      <td
                        className={cn(
                          'px-4 py-2.5 text-right font-semibold tabular-nums',
                          m.direction === 'CHARGE' ? 'text-danger' : 'text-success',
                        )}
                      >
                        {m.direction === 'CHARGE' ? '-' : '+'}
                        {formatCentsToMXN(m.amountCents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : balancesLoading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : balances?.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-muted">
          No hay empleados con saldo en el alcance seleccionado.
        </p>
      ) : (
        <div className="space-y-2">
          {balances?.map((b) => (
            <div
              key={b.employeeId}
              className="flex items-center justify-between rounded-card border border-line bg-surface p-4 shadow-control"
            >
              <div>
                <p className="font-semibold text-ink">
                  {b.displayName} <span className="font-mono text-xs font-normal text-muted">{b.employeeNumber}</span>
                </p>
                <p className="text-sm text-muted">{b.branch?.name ?? 'Sin sucursal'}</p>
              </div>
              <p
                className={cn(
                  'text-lg font-extrabold tabular-nums',
                  b.balanceCents > 0 ? 'text-danger' : b.balanceCents < 0 ? 'text-success' : 'text-muted',
                )}
              >
                {formatCentsToMXN(Math.abs(b.balanceCents))}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
