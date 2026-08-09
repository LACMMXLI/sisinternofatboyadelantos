import { useMemo } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NotebookShell } from '@/components/notebook/NotebookShell';
import type { NotebookRowMovement } from '@/components/notebook/MovementRow';
import { BalanceCard } from '@/components/balance/BalanceCard';
import { EmployeeIdentityCard } from '@/components/employees/EmployeeIdentityCard';
import { useEmployee } from '@/features/empleados/api';
import { useLedgerSummary, useMovements } from '@/features/libreta/api';
import { formatBusinessTime } from '@/lib/utils/date';

interface EmployeeDetailDrawerProps {
  employeeId: string;
  onClose: () => void;
}

const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Tijuana',
  day: '2-digit',
  month: 'short',
});

/**
 * Panel lateral de detalle de empleado (§2/§5 de la corrección): se abre al
 * pulsar el nombre de un empleado en la hoja diaria — no reemplaza toda la
 * libreta, solo se superpone con su saldo, desglose e historial completo.
 */
export function EmployeeDetailDrawer({ employeeId, onClose }: EmployeeDetailDrawerProps) {
  const { data: employee } = useEmployee(employeeId);
  const { data: summary } = useLedgerSummary(employeeId);
  const { data: movements } = useMovements(employeeId);

  const notebookMovements: NotebookRowMovement[] = useMemo(
    () =>
      (movements ?? [])
        .filter((m) => m.status !== 'REJECTED')
        .map((m) => {
          const occurred = new Date(m.occurredAt);
          return {
            id: m.id,
            dateLabel: DATE_FORMAT.format(occurred),
            timeLabel: formatBusinessTime(m.occurredAt),
            concept:
              m.status === 'PENDING_APPROVAL'
                ? `${m.concept} (pendiente)`
                : m.status === 'REVERSED'
                  ? `${m.concept} (revertido)`
                  : m.concept,
            categoryLabel: m.category.label,
            categoryColorToken: m.category.colorToken,
            direction: m.direction,
            amountCents: m.amountCents,
            registeredBy: m.createdBy?.displayName ?? '—',
          };
        }),
    [movements],
  );

  const breakdown = useMemo(() => {
    const items = summary?.breakdown ?? [];
    const total = items.reduce((sum, item) => sum + item.amountCents, 0) || 1;
    return items.map((item) => ({
      label: item.label,
      amountCents: item.amountCents,
      colorVar: `var(--${item.colorToken})`,
      percent: Math.round((item.amountCents / total) * 100),
    }));
  }, [summary]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-ink/40" role="dialog" aria-modal="true">
      <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto border-l border-line bg-canvas p-4 shadow-panel sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wide text-muted uppercase">Detalle del empleado</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-control text-muted hover:bg-surface-soft hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {employee ? (
          <div className="space-y-3.5">
            <div className="rounded-card border border-line bg-surface p-4 shadow-control">
              <EmployeeIdentityCard
                displayName={employee.displayName}
                jobTitle={employee.jobTitle || 'Sin puesto'}
                employeeNumber={employee.employeeNumber}
                active={employee.active}
                tabs={['Movimientos']}
                activeTab="Movimientos"
                onTabChange={() => {}}
              />
              <Link
                to={`/app/empleados/${employee.id}`}
                className="mt-1 inline-block text-xs font-semibold text-brand-600 hover:underline"
              >
                Ver expediente completo →
              </Link>
            </div>

            <BalanceCard balanceCents={summary?.balanceCents ?? 0} breakdown={breakdown} />

            <NotebookShell
              employeeFirstName={employee.displayName.split(' ')[0]}
              periodLabel="Historial completo"
              movements={notebookMovements}
              totalCents={summary?.balanceCents ?? 0}
            />
          </div>
        ) : (
          <p className="p-6 text-center text-sm text-muted">Cargando…</p>
        )}
      </div>
    </div>
  );
}
