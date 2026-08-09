import { useMemo, useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { DayHeader } from '@/components/notebook/DayHeader';
import { DailySheet } from '@/components/notebook/DailySheet';
import { QuickCaptureBar } from '@/components/movement/QuickCaptureBar';
import { MobileCaptureSheet } from '@/components/movement/MobileCaptureSheet';
import { EmployeeDetailDrawer } from '@/components/employees/EmployeeDetailDrawer';
import { RecentEmployeesStrip } from '@/components/employees/RecentEmployeesStrip';
import { useEmployees } from '@/features/empleados/api';
import { useMovementCategories, useBranches } from '@/features/configuracion/api';
import { useDailyMovements } from '@/features/libreta/api';
import { businessDayRangeUtc, formatFullSpanishDate, todayBusinessDateKey, addDaysToDateKey } from '@/lib/utils/date';

/**
 * Pantalla insignia — "Libreta del día" (corrección 2026-08-09, ver
 * `IMPLEMENTATION_PLAN.md`). Cambio de modelo mental: de "seleccionar
 * empleado → consultar saldo" a "abrir la libreta de hoy → ver todo lo
 * anotado → escribir la siguiente anotación → consultar un empleado solo
 * cuando haga falta". El empleado es un dato de cada anotación, no el dueño
 * de la pantalla.
 */
export function LibretaPage() {
  const [dateKey, setDateKey] = useState(todayBusinessDateKey());
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [sortAsc, setSortAsc] = useState(false);
  const [drawerEmployeeId, setDrawerEmployeeId] = useState<string | null>(null);
  const [mobileCaptureOpen, setMobileCaptureOpen] = useState(false);

  const { data: branches } = useBranches();
  const activeBranchId = branchId ?? branches?.[0]?.id;
  const { data: employees } = useEmployees({ active: true, branchId: activeBranchId });
  const { data: categories } = useMovementCategories(false);

  const { from, to } = useMemo(() => businessDayRangeUtc(dateKey), [dateKey]);
  const { data: movements, isLoading } = useDailyMovements({
    fromIso: from.toISOString(),
    toIso: to.toISOString(),
    branchId: activeBranchId,
  });

  const isToday = dateKey === todayBusinessDateKey();
  const dateLabel = formatFullSpanishDate(dateKey);

  const sortedMovements = useMemo(() => {
    const list = [...(movements ?? [])];
    list.sort((a, b) => {
      const diff = new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
      return sortAsc ? diff : -diff;
    });
    return list;
  }, [movements, sortAsc]);

  const stats = useMemo(() => {
    const list = movements ?? [];
    let chargeCents = 0;
    let creditCents = 0;
    let pendingCount = 0;
    for (const m of list) {
      if (m.status === 'PENDING_APPROVAL') pendingCount += 1;
      if (m.status !== 'POSTED') continue;
      if (m.direction === 'CHARGE') chargeCents += m.amountCents;
      else creditCents += m.amountCents;
    }
    return { count: list.length, chargeCents, creditCents, pendingCount };
  }, [movements]);

  const recentEmployees = useMemo(() => {
    const seen = new Map<string, string>();
    for (const m of sortedMovements) {
      if (m.employee && !seen.has(m.employee.id)) seen.set(m.employee.id, m.employee.displayName);
      if (seen.size >= 8) break;
    }
    return [...seen.entries()].map(([id, displayName]) => ({ id, displayName }));
  }, [sortedMovements]);

  const employeeOptions = useMemo(
    () =>
      (employees ?? []).map((e) => ({
        id: e.id,
        displayName: e.displayName,
        jobTitle: e.jobTitle || 'Sin puesto',
        employeeNumber: e.employeeNumber,
      })),
    [employees],
  );

  const resolveBranchId = (employeeId: string): string | undefined => {
    const employee = employees?.find((e) => e.id === employeeId);
    return employee?.primaryBranchId ?? activeBranchId;
  };

  return (
    <div className="space-y-3.5 pb-24 md:pb-3.5">
      <DayHeader
        dateKey={dateKey}
        dateLabel={dateLabel}
        isToday={isToday}
        onPrevDay={() => setDateKey((d) => addDaysToDateKey(d, -1))}
        onNextDay={() => setDateKey((d) => addDaysToDateKey(d, 1))}
        onToday={() => setDateKey(todayBusinessDateKey())}
        onPickDate={setDateKey}
        branches={branches ?? []}
        branchId={activeBranchId}
        onBranchChange={setBranchId}
        stats={stats}
      />

      {recentEmployees.length > 0 ? (
        <RecentEmployeesStrip employees={recentEmployees} onSelect={setDrawerEmployeeId} />
      ) : null}

      <div className="grid gap-3.5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DailySheet
          movements={isLoading ? [] : sortedMovements}
          sortAsc={sortAsc}
          onToggleSort={() => setSortAsc((v) => !v)}
          onEmployeeClick={setDrawerEmployeeId}
          netCents={stats.chargeCents - stats.creditCents}
          hasEmployees={(employees?.length ?? 0) > 0}
          onEmptyCta={() => setMobileCaptureOpen(true)}
        />

        <div className="hidden xl:block">
          <QuickCaptureBar employees={employeeOptions} categories={categories ?? []} resolveBranchId={resolveBranchId} />
        </div>
      </div>

      {/* Tablet: captura visible bajo la hoja, sin necesidad de sheet (§7). */}
      <div className="hidden md:block xl:hidden">
        <QuickCaptureBar employees={employeeOptions} categories={categories ?? []} resolveBranchId={resolveBranchId} />
      </div>

      {/* Móvil: botón fijo + bottom sheet (§7). */}
      <button
        type="button"
        onClick={() => setMobileCaptureOpen(true)}
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 flex h-14 items-center gap-2 rounded-full bg-success px-5 text-sm font-bold text-white shadow-panel md:hidden"
      >
        <NotebookPen size={18} /> Anotar movimiento
      </button>

      {mobileCaptureOpen ? (
        <MobileCaptureSheet
          employees={employeeOptions}
          categories={categories ?? []}
          resolveBranchId={resolveBranchId}
          onClose={() => setMobileCaptureOpen(false)}
        />
      ) : null}

      {drawerEmployeeId ? (
        <EmployeeDetailDrawer employeeId={drawerEmployeeId} onClose={() => setDrawerEmployeeId(null)} />
      ) : null}
    </div>
  );
}
