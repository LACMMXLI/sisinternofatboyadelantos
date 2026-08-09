import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Wallet } from 'lucide-react';
import type { PayrollPeriodFrequency } from '@libreta/shared';
import {
  useCreatePayrollPeriod,
  usePayrollBatches,
  usePayrollPeriods,
  usePrepareBatch,
} from '../api';
import { useBranches } from '@/features/configuracion/api';
import { formatCentsToMXN } from '@/lib/utils/money';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  UNDER_REVIEW: 'En revisión',
  LOCKED: 'Bloqueado',
  APPLIED: 'Aplicado',
  CLOSED: 'Cerrado',
  REOPENED: 'Reabierto',
};

const STATUS_TONE: Record<string, string> = {
  DRAFT: 'bg-line text-muted',
  UNDER_REVIEW: 'bg-warning-soft text-warning',
  LOCKED: 'bg-purple-soft text-purple',
  APPLIED: 'bg-success-soft text-success',
  CLOSED: 'bg-brand-600/10 text-brand-700',
  REOPENED: 'bg-danger-soft text-danger',
};

const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Nómina (Fase 5): periodos y lotes. No calcula sueldo/ISR/IMSS — solo
 * prepara y aplica el descuento de saldos pendientes del ledger contra un
 * periodo (§Fase 5 de IMPLEMENTATION_PLAN.md).
 */
export function NominaPage() {
  const navigate = useNavigate();
  const { data: periods } = usePayrollPeriods();
  const { data: batches, isLoading } = usePayrollBatches();
  const { data: branches } = useBranches();
  const createPeriod = useCreatePayrollPeriod();
  const prepareBatch = usePrepareBatch();

  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [frequency, setFrequency] = useState<PayrollPeriodFrequency>('WEEKLY');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [payDate, setPayDate] = useState('');
  const [periodError, setPeriodError] = useState<string | null>(null);

  const [showPrepareForm, setShowPrepareForm] = useState(false);
  const [prepPeriodId, setPrepPeriodId] = useState('');
  const [prepBranchId, setPrepBranchId] = useState('');
  const [prepareError, setPrepareError] = useState<string | null>(null);

  const onCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setPeriodError(null);
    try {
      await createPeriod.mutateAsync({
        frequency,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        payDate: new Date(payDate).toISOString(),
      });
      setStartsAt('');
      setEndsAt('');
      setPayDate('');
      setShowPeriodForm(false);
    } catch (err) {
      setPeriodError(err instanceof ApiError ? err.message : 'No se pudo crear el periodo.');
    }
  };

  const onPrepareBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrepareError(null);
    try {
      const batch = await prepareBatch.mutateAsync({
        periodId: prepPeriodId,
        branchId: prepBranchId || undefined,
      });
      setShowPrepareForm(false);
      setPrepPeriodId('');
      setPrepBranchId('');
      navigate(`/app/nomina/${batch.id}`);
    } catch (err) {
      setPrepareError(err instanceof ApiError ? err.message : 'No se pudo preparar el lote.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-success/10 text-success">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-ink">Nómina</h1>
              <p className="text-sm text-muted">Periodos, lotes y liquidación de saldos pendientes.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPeriodForm((v) => !v)}
            className="flex h-10 items-center gap-1.5 rounded-control border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-soft"
          >
            <Plus size={16} /> Periodo
          </button>
        </div>

        {showPeriodForm ? (
          <form
            onSubmit={(e) => void onCreatePeriod(e)}
            className="mb-4 space-y-3 rounded-card border border-line bg-surface p-5 shadow-control"
          >
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Frecuencia</p>
              <div className="flex gap-2">
                {(['WEEKLY', 'BIWEEKLY'] as PayrollPeriodFrequency[]).map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={cn(
                      'flex-1 rounded-control border px-3 py-2 text-sm font-semibold',
                      frequency === f
                        ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                        : 'border-line text-muted hover:bg-surface-soft',
                    )}
                  >
                    {f === 'WEEKLY' ? 'Semanal' : 'Quincenal'}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="startsAt" className="mb-1.5 block text-sm font-medium text-ink">
                  Inicio
                </label>
                <input
                  id="startsAt"
                  type="date"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="h-11 w-full rounded-control border border-line bg-surface-soft px-3 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
                />
              </div>
              <div>
                <label htmlFor="endsAt" className="mb-1.5 block text-sm font-medium text-ink">
                  Fin
                </label>
                <input
                  id="endsAt"
                  type="date"
                  required
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="h-11 w-full rounded-control border border-line bg-surface-soft px-3 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
                />
              </div>
              <div>
                <label htmlFor="payDate" className="mb-1.5 block text-sm font-medium text-ink">
                  Pago
                </label>
                <input
                  id="payDate"
                  type="date"
                  required
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="h-11 w-full rounded-control border border-line bg-surface-soft px-3 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
                />
              </div>
            </div>
            {periodError ? <p className="text-sm text-danger">{periodError}</p> : null}
            <button
              type="submit"
              disabled={createPeriod.isPending}
              className="h-10 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
            >
              {createPeriod.isPending ? 'Creando…' : 'Crear periodo'}
            </button>
          </form>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {periods?.map((p) => (
            <span
              key={p.id}
              className={cn(
                'rounded-pill px-3 py-1.5 text-xs font-semibold',
                p.status === 'OPEN' ? 'bg-success-soft text-success' : 'bg-line text-muted',
              )}
            >
              {DATE_FORMAT.format(new Date(p.startsAt))} – {DATE_FORMAT.format(new Date(p.endsAt))}
              {p.status === 'CLOSED' ? ' · Cerrado' : ''}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Lotes</h2>
          <button
            type="button"
            onClick={() => setShowPrepareForm((v) => !v)}
            className="flex h-10 items-center gap-1.5 rounded-control bg-success px-4 text-sm font-semibold text-white shadow-control hover:brightness-105"
          >
            <Plus size={16} /> Preparar lote
          </button>
        </div>

        {showPrepareForm ? (
          <form
            onSubmit={(e) => void onPrepareBatch(e)}
            className="mb-4 space-y-3 rounded-card border border-line bg-surface p-5 shadow-control"
          >
            <div>
              <label htmlFor="prepPeriod" className="mb-1.5 block text-sm font-medium text-ink">
                Periodo
              </label>
              <select
                id="prepPeriod"
                required
                value={prepPeriodId}
                onChange={(e) => setPrepPeriodId(e.target.value)}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              >
                <option value="" disabled>
                  Selecciona un periodo abierto
                </option>
                {periods
                  ?.filter((p) => p.status === 'OPEN')
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {DATE_FORMAT.format(new Date(p.startsAt))} – {DATE_FORMAT.format(new Date(p.endsAt))}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="prepBranch" className="mb-1.5 block text-sm font-medium text-ink">
                Sucursal (opcional — vacío incluye todas las accesibles)
              </label>
              <select
                id="prepBranch"
                value={prepBranchId}
                onChange={(e) => setPrepBranchId(e.target.value)}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              >
                <option value="">Todas las sucursales accesibles</option>
                {branches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            {prepareError ? <p className="text-sm text-danger">{prepareError}</p> : null}
            <button
              type="submit"
              disabled={prepareBatch.isPending}
              className="h-10 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
            >
              {prepareBatch.isPending ? 'Preparando…' : 'Preparar lote'}
            </button>
          </form>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : batches?.length === 0 ? (
          <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-muted">
            No hay lotes todavía.
          </p>
        ) : (
          <div className="space-y-2.5">
            {batches?.map((batch) => (
              <Link
                key={batch.id}
                to={`/app/nomina/${batch.id}`}
                className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-control transition hover:border-brand-500/50 hover:bg-surface-soft"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {DATE_FORMAT.format(new Date(batch.period.startsAt))} –{' '}
                    {DATE_FORMAT.format(new Date(batch.period.endsAt))}
                    {batch.branch ? ` · ${batch.branch.name}` : ' · Todas las sucursales'}
                  </p>
                  <p className="text-sm text-muted">
                    {batch.items.length} empleado{batch.items.length !== 1 ? 's' : ''} ·{' '}
                    {formatCentsToMXN(batch.totalPlannedCents)} planeado
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-pill px-2.5 py-1 text-xs font-semibold',
                    STATUS_TONE[batch.status],
                  )}
                >
                  {STATUS_LABELS[batch.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
