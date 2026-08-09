import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { MessageSquareText, Plus } from 'lucide-react';
import { EmployeeList, type EmployeeListEntry } from '@/components/employees/EmployeeList';
import { EmployeeIdentityCard } from '@/components/employees/EmployeeIdentityCard';
import { NotebookShell } from '@/components/notebook/NotebookShell';
import type { NotebookRowMovement } from '@/components/notebook/MovementRow';
import { BalanceCard } from '@/components/balance/BalanceCard';
import { QuickMovementGrid } from '@/components/movement/QuickMovementGrid';
import { NewMovementSheet } from '@/components/movement/NewMovementSheet';
import { RecentActivityCard, type RecentActivityItem } from '@/components/dashboard/RecentActivityCard';
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import { useEmployees } from '@/features/empleados/api';
import { useMovementCategories } from '@/features/configuracion/api';
import { useLedgerSummary, useMovements, type LedgerSummary } from '@/features/libreta/api';
import { apiFetch } from '@/lib/api/client';

const TABS = ['Movimientos', 'Resumen', 'Historial Semanal', 'Notas'];

const DATE_FORMAT = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' });
const TIME_FORMAT = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });

/**
 * Pantalla insignia (§4.5), conectada a datos reales desde la Fase 4:
 * `EmployeesModule` + `LedgerModule`. Los widgets secundarios de la fila
 * inferior (`RecentActivityCard`, `WeeklySummaryCard`) derivan del mismo
 * resumen/movimientos reales — no queda ningún dato de ejemplo visible en
 * esta pantalla. `QuickActionsCard` sigue siendo estático a propósito: sus
 * acciones (historial completo, imprimir, enviar a nómina) llegan en fases
 * posteriores (7/8/5).
 */
export function LibretaPage() {
  const { data: employees } = useEmployees({ active: true });
  const { data: categories } = useMovementCategories(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('Movimientos');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetCategoryId, setSheetCategoryId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!selectedId && employees && employees.length > 0) {
      setSelectedId(employees[0].id);
    }
  }, [employees, selectedId]);

  const balanceQueries = useQueries({
    queries: (employees ?? []).map((emp) => ({
      queryKey: ['ledger-summary', emp.id],
      queryFn: () => apiFetch<LedgerSummary>(`/employees/${emp.id}/ledger/summary`),
      staleTime: 15_000,
    })),
  });

  const employeeListEntries: EmployeeListEntry[] = useMemo(
    () =>
      (employees ?? []).map((emp, index) => ({
        id: emp.id,
        displayName: emp.displayName,
        jobTitle: emp.jobTitle || 'Sin puesto',
        balanceCents: balanceQueries[index]?.data?.balanceCents ?? 0,
        active: emp.active,
      })),
    [employees, balanceQueries],
  );

  const employee = employees?.find((e) => e.id === selectedId);
  const { data: summary } = useLedgerSummary(selectedId ?? undefined);
  const { data: movements } = useMovements(selectedId ?? undefined);

  const notebookMovements: NotebookRowMovement[] = useMemo(
    () =>
      (movements ?? [])
        .filter((m) => m.status !== 'REJECTED')
        .map((m) => {
          const occurred = new Date(m.occurredAt);
          return {
            id: m.id,
            dateLabel: DATE_FORMAT.format(occurred),
            timeLabel: TIME_FORMAT.format(occurred),
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

  const recentActivity: RecentActivityItem[] = useMemo(() => {
    const todayKey = new Date().toDateString();
    return (movements ?? [])
      .filter((m) => m.status === 'POSTED' && new Date(m.occurredAt).toDateString() === todayKey)
      .slice(0, 3)
      .map((m) => ({
        id: m.id,
        timeLabel: TIME_FORMAT.format(new Date(m.occurredAt)),
        label: m.concept,
        amountCents: m.amountCents,
        iconName: m.category.iconName,
        colorToken: m.category.colorToken,
      }));
  }, [movements]);

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

  const firstName = employee?.displayName.split(' ')[0] ?? '';

  const openSheet = (categoryId?: string) => {
    setSheetCategoryId(categoryId);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-3.5">
      <div className="grid gap-3.5 xl:grid-cols-[280px_minmax(560px,1fr)_300px]">
        <EmployeeList
          employees={employeeListEntries}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNewMovement={() => openSheet()}
        />

        <div className="rounded-card border border-line bg-surface p-4 shadow-control xl:min-h-[70vh]">
          {employee ? (
            <>
              <EmployeeIdentityCard
                displayName={employee.displayName}
                jobTitle={employee.jobTitle || 'Sin puesto'}
                employeeNumber={employee.employeeNumber}
                active={employee.active}
                tabs={TABS}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
              <NotebookShell
                employeeFirstName={firstName}
                periodLabel="Saldo actual"
                movements={notebookMovements}
                totalCents={summary?.balanceCents ?? 0}
              />
            </>
          ) : (
            <p className="p-6 text-center text-sm text-muted">
              {employees?.length === 0
                ? 'No hay empleados activos. Da de alta uno en Empleados.'
                : 'Selecciona un empleado.'}
            </p>
          )}
        </div>

        <div className="space-y-2.5">
          <BalanceCard balanceCents={summary?.balanceCents ?? 0} breakdown={breakdown} />

          <button
            type="button"
            onClick={() => openSheet()}
            disabled={!employee}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-success text-sm font-semibold text-white shadow-control transition hover:brightness-105 disabled:opacity-60"
          >
            <Plus size={18} /> Nuevo Movimiento
          </button>

          <QuickMovementGrid categories={categories ?? []} onSelectCategory={(id) => openSheet(id)} />

          <button
            type="button"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-control bg-brand-600/8 text-sm font-semibold text-brand-700 hover:bg-brand-600/14"
          >
            <MessageSquareText size={16} /> Nota / Comentario
          </button>
        </div>
      </div>

      <div className="grid gap-3.5 lg:grid-cols-3">
        <RecentActivityCard items={recentActivity} />
        <WeeklySummaryCard totalCents={summary?.balanceCents ?? 0} breakdown={breakdown} />
        <QuickActionsCard />
      </div>

      {sheetOpen && employee ? (
        <NewMovementSheet
          employeeId={employee.id}
          employeeDisplayName={employee.displayName}
          branchId={employee.primaryBranchId}
          categories={categories ?? []}
          initialCategoryId={sheetCategoryId}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </div>
  );
}
