import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { NotebookPen, Users } from 'lucide-react';
import { NotebookShell } from '@/components/notebook/NotebookShell';
import type { NotebookRowMovement } from '@/components/notebook/MovementRow';
import { BalanceCard } from '@/components/balance/BalanceCard';
import { EmployeeIdentityCard } from '@/components/employees/EmployeeIdentityCard';
import { useEmployee } from '@/features/empleados/api';
import { useLedgerSummary, useMovements } from '@/features/libreta/api';
import { formatBusinessTime } from '@/lib/utils/date';

const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', {
  timeZone: 'America/Tijuana',
  day: '2-digit',
  month: 'short',
});

interface EmployeeWorkspacePanelProps {
  employeeId: string | null;
  onNewMovement: () => void;
}

/**
 * Hoja derecha, grande, de la libreta (pantalla principal, corrección
 * 2026-08-09 #2): identidad + saldo + historial completo del empleado
 * elegido en la hoja izquierda (`EmployeeList`). Reemplaza al antiguo
 * `EmployeeDetailDrawer` como superposición modal — el detalle ahora vive
 * fijo en pantalla, como la página derecha de una libreta abierta, en vez
 * de taparla.
 */
export function EmployeeWorkspacePanel({ employeeId, onNewMovement }: EmployeeWorkspacePanelProps) {
  const { data: employee } = useEmployee(employeeId ?? undefined);
  const { data: summary } = useLedgerSummary(employeeId ?? undefined);
  const { data: movements } = useMovements(employeeId ?? undefined);

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

  if (!employeeId) {
    return (
      <section className="grid place-items-center rounded-card border border-dashed border-line bg-surface/60 p-8 text-center xl:min-h-[70vh]">
        <div className="max-w-xs space-y-2">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-600/10 text-brand-600">
            <Users size={22} />
          </div>
          <p className="text-sm font-semibold text-ink">Elige un empleado</p>
          <p className="text-sm text-muted">
            Selecciona un nombre en la lista de la izquierda para ver su saldo, desglose e historial completo.
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="rounded-card border border-line bg-surface p-4 shadow-control">
        {employee ? (
          <>
            <EmployeeIdentityCard
              displayName={employee.displayName}
              jobTitle={employee.jobTitle || 'Sin puesto'}
              employeeNumber={employee.employeeNumber}
              active={employee.active}
              tabs={['Movimientos']}
              activeTab="Movimientos"
              onTabChange={() => {}}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to={`/app/empleados/${employee.id}`}
                className="text-xs font-semibold text-brand-600 hover:underline"
              >
                Ver expediente completo →
              </Link>
              <button
                type="button"
                onClick={onNewMovement}
                className="ml-auto flex h-9 items-center gap-1.5 rounded-control bg-brand-600 px-3.5 text-xs font-semibold text-white shadow-control hover:brightness-105"
              >
                <NotebookPen size={14} /> Nuevo movimiento
              </button>
            </div>
          </>
        ) : (
          <p className="p-4 text-center text-sm text-muted">Cargando…</p>
        )}
      </div>

      <BalanceCard
        balanceCents={summary?.balanceCents ?? 0}
        breakdown={breakdown}
        baseSalaryCents={employee?.baseSalaryCents}
      />

      <NotebookShell
        employeeFirstName={employee?.displayName.split(' ')[0] ?? ''}
        periodLabel="Historial completo"
        movements={notebookMovements}
        totalCents={summary?.balanceCents ?? 0}
      />
    </div>
  );
}
