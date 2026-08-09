import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Receipt } from 'lucide-react';
import {
  usePayrollBatch,
  useApplyBatch,
  useCloseBatch,
  useExportBatchPdf,
  useLockBatch,
  useReopenBatch,
  useSubmitBatch,
  useUpdateBatchItem,
} from '../api';
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

const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Detalle de lote de nómina (Fase 5): renglones por empleado con monto
 * planeado editable (mientras el lote sea editable) y los botones de
 * transición de estado (§Fase 5). No calcula sueldo/ISR/IMSS.
 */
export function NominaBatchPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { data: batch, isLoading } = usePayrollBatch(batchId);
  const updateItem = useUpdateBatchItem();
  const submitBatch = useSubmitBatch();
  const lockBatch = useLockBatch();
  const applyBatch = useApplyBatch();
  const closeBatch = useCloseBatch();
  const reopenBatch = useReopenBatch();
  const exportPdf = useExportBatchPdf();

  const [error, setError] = useState<string | null>(null);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenForm, setShowReopenForm] = useState(false);

  if (isLoading) return <p className="mx-auto max-w-3xl text-sm text-muted">Cargando…</p>;
  if (!batch) {
    return (
      <div className="mx-auto max-w-3xl">
        <Link to="/app/nomina" className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-600">
          <ArrowLeft size={15} /> Volver a nómina
        </Link>
        <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-muted">
          No se encontró el lote.
        </p>
      </div>
    );
  }

  const editable = batch.status === 'DRAFT' || batch.status === 'REOPENED';

  const runAction = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo completar la acción.');
    }
  };

  const onChangeAmount = async (itemId: string, value: string) => {
    const cents = Math.round(Number.parseFloat(value || '0') * 100);
    if (!Number.isFinite(cents) || cents < 0) return;
    await runAction(() =>
      updateItem.mutateAsync({ batchId: batch.id, itemId, plannedAmountCents: cents }),
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/app/nomina" className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-600">
        <ArrowLeft size={15} /> Volver a nómina
      </Link>

      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-success/10 text-success">
          <Receipt size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-ink">
            {DATE_FORMAT.format(new Date(batch.period.startsAt))} –{' '}
            {DATE_FORMAT.format(new Date(batch.period.endsAt))}
          </h1>
          <p className="text-sm text-muted">{batch.branch ? batch.branch.name : 'Todas las sucursales'}</p>
        </div>
        <span className="shrink-0 rounded-pill bg-brand-600/10 px-3 py-1.5 text-xs font-semibold text-brand-700">
          {STATUS_LABELS[batch.status]}
        </span>
        <button
          type="button"
          onClick={() =>
            void exportPdf.mutateAsync({
              batchId: batch.id,
              filename: `nomina-${DATE_FORMAT.format(new Date(batch.period.startsAt)).replace(/\s/g, '-')}.pdf`,
            })
          }
          disabled={exportPdf.isPending}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-control border border-line px-3 text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-60"
        >
          <Download size={14} /> {exportPdf.isPending ? 'Generando…' : 'Exportar PDF'}
        </button>
      </div>

      {batch.reopenReason ? (
        <p className="mb-4 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
          Reabierto: {batch.reopenReason}
        </p>
      ) : null}

      <div className="mb-4 overflow-x-auto rounded-card border border-line bg-surface shadow-control">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-semibold tracking-wide text-muted uppercase">
              <th className="px-4 py-2.5">Empleado</th>
              <th className="px-4 py-2.5 text-right">Saldo al preparar</th>
              <th className="px-4 py-2.5 text-right">Planeado</th>
              <th className="px-4 py-2.5 text-right">Aplicado</th>
            </tr>
          </thead>
          <tbody>
            {batch.items.map((item) => (
              <tr key={item.id} className="border-b border-line/70 last:border-b-0">
                <td className="px-4 py-2.5 font-medium text-ink">
                  {item.employee.displayName}{' '}
                  <span className="font-mono text-xs text-muted">{item.employee.employeeNumber}</span>
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                  {formatCentsToMXN(item.balanceAtPrepCents)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {editable ? (
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      defaultValue={(item.plannedAmountCents / 100).toFixed(2)}
                      onBlur={(e) => void onChangeAmount(item.id, e.target.value)}
                      className="h-9 w-28 rounded-control border border-line bg-surface-soft px-2 text-right text-sm tabular-nums outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
                    />
                  ) : (
                    <span className="tabular-nums text-ink">{formatCentsToMXN(item.plannedAmountCents)}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-success">
                  {item.appliedAmountCents > 0 ? formatCentsToMXN(item.appliedAmountCents) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-line font-semibold text-ink">
              <td className="px-4 py-2.5">Total</td>
              <td className="px-4 py-2.5 text-right tabular-nums">
                {formatCentsToMXN(batch.items.reduce((s, i) => s + i.balanceAtPrepCents, 0))}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{formatCentsToMXN(batch.totalPlannedCents)}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{formatCentsToMXN(batch.totalAppliedCents)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        {editable ? (
          <button
            type="button"
            onClick={() => void runAction(() => submitBatch.mutateAsync(batch.id))}
            disabled={submitBatch.isPending}
            className="h-10 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            Enviar a revisión
          </button>
        ) : null}

        {batch.status === 'UNDER_REVIEW' ? (
          <button
            type="button"
            onClick={() => void runAction(() => lockBatch.mutateAsync(batch.id))}
            disabled={lockBatch.isPending}
            className="h-10 rounded-control bg-purple px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            Bloquear para aplicar
          </button>
        ) : null}

        {batch.status === 'LOCKED' ? (
          <button
            type="button"
            onClick={() => void runAction(() => applyBatch.mutateAsync(batch.id))}
            disabled={applyBatch.isPending}
            className="h-10 rounded-control bg-success px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {applyBatch.isPending ? 'Aplicando…' : 'Aplicar al ledger'}
          </button>
        ) : null}

        {batch.status === 'APPLIED' ? (
          <button
            type="button"
            onClick={() => void runAction(() => closeBatch.mutateAsync(batch.id))}
            disabled={closeBatch.isPending}
            className="h-10 rounded-control border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-soft disabled:opacity-60"
          >
            Cerrar lote
          </button>
        ) : null}

        {batch.status === 'CLOSED' ? (
          <button
            type="button"
            onClick={() => setShowReopenForm((v) => !v)}
            className="h-10 rounded-control border border-danger/40 px-4 text-sm font-semibold text-danger hover:bg-danger-soft"
          >
            Reabrir lote
          </button>
        ) : null}
      </div>

      {showReopenForm ? (
        <div className="mt-3 space-y-2 rounded-card border border-danger/40 bg-danger-soft p-4">
          <label htmlFor="reopenReason" className="block text-sm font-medium text-ink">
            Motivo de la reapertura (obligatorio, queda auditado)
          </label>
          <textarea
            id="reopenReason"
            value={reopenReason}
            onChange={(e) => setReopenReason(e.target.value)}
            rows={2}
            className="w-full rounded-control border border-line bg-surface px-3.5 py-2 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
          />
          <button
            type="button"
            onClick={() =>
              void runAction(async () => {
                if (!reopenReason.trim()) {
                  setError('El motivo es obligatorio.');
                  return;
                }
                await reopenBatch.mutateAsync({ batchId: batch.id, reason: reopenReason.trim() });
                setShowReopenForm(false);
                setReopenReason('');
              })
            }
            disabled={reopenBatch.isPending}
            className={cn(
              'h-10 rounded-control bg-danger px-4 text-sm font-semibold text-white hover:brightness-105',
              'disabled:opacity-60',
            )}
          >
            Confirmar reapertura
          </button>
        </div>
      ) : null}
    </div>
  );
}
