import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Filter,
  RefreshCw,
  Search,
} from 'lucide-react';
import { DailyEmployeeRow } from '@/components/notebook/DailyEmployeeRow';
import { useBranches, useMovementCategories } from '@/features/configuracion/api';
import { useEmployees } from '@/features/empleados/api';
import {
  useDailyMovements,
  useEmployeeLedgerSummaries,
  type MovementView,
} from '@/features/libreta/api';
import {
  addDaysToDateKey,
  businessDayRangeUtc,
  formatFullSpanishDate,
  todayBusinessDateKey,
} from '@/lib/utils/date';
import { formatCentsToMXN } from '@/lib/utils/money';

export function LibretaPage() {
  const [dateKey, setDateKey] = useState(todayBusinessDateKey);
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<string | null>(null);
  const [onlyWithMovements, setOnlyWithMovements] = useState(false);
  const initializedEmployeeRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const { data: branches } = useBranches();
  const activeBranchId = branchId ?? branches?.[0]?.id;
  const activeBranch = branches?.find((branch) => branch.id === activeBranchId);
  const { data: employees, isLoading: employeesLoading } = useEmployees({
    active: true,
    branchId: activeBranchId,
    search: search || undefined,
  });
  const { data: categories } = useMovementCategories(false);

  const range = useMemo(() => businessDayRangeUtc(dateKey), [dateKey]);
  const {
    data: dailyMovements,
    isLoading: movementsLoading,
    isFetching,
    refetch,
  } = useDailyMovements({
    fromIso: range.from.toISOString(),
    toIso: range.to.toISOString(),
    branchId: activeBranchId,
  });

  const employeeIds = useMemo(() => (employees ?? []).map((employee) => employee.id), [employees]);
  const summaries = useEmployeeLedgerSummaries(employeeIds);

  const movementsByEmployee = useMemo(() => {
    const grouped = new Map<string, MovementView[]>();
    (dailyMovements ?? [])
      .filter((movement) => movement.status !== 'REJECTED')
      .sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt))
      .forEach((movement) => {
        const current = grouped.get(movement.employeeId) ?? [];
        current.push(movement);
        grouped.set(movement.employeeId, current);
      });
    return grouped;
  }, [dailyMovements]);

  const visibleEmployees = useMemo(() => {
    const rows = [...(employees ?? [])].sort((left, right) => {
      const movementDifference =
        (movementsByEmployee.get(right.id)?.length ?? 0) -
        (movementsByEmployee.get(left.id)?.length ?? 0);
      return movementDifference || left.displayName.localeCompare(right.displayName, 'es');
    });
    return onlyWithMovements
      ? rows.filter((employee) => (movementsByEmployee.get(employee.id)?.length ?? 0) > 0)
      : rows;
  }, [employees, movementsByEmployee, onlyWithMovements]);

  useEffect(() => {
    if (visibleEmployees.length === 0) {
      setExpandedEmployeeId(null);
      initializedEmployeeRef.current = false;
      return;
    }
    if (!initializedEmployeeRef.current) {
      initializedEmployeeRef.current = true;
      setExpandedEmployeeId(visibleEmployees[0].id);
      return;
    }
    if (expandedEmployeeId && !visibleEmployees.some((employee) => employee.id === expandedEmployeeId)) {
      setExpandedEmployeeId(visibleEmployees[0].id);
    }
  }, [expandedEmployeeId, visibleEmployees]);

  const activeMovements = useMemo(
    () => (dailyMovements ?? []).filter((movement) => !['REJECTED', 'REVERSED'].includes(movement.status)),
    [dailyMovements],
  );
  const chargesCents = activeMovements
    .filter((movement) => movement.direction !== 'CREDIT')
    .reduce((sum, movement) => sum + movement.amountCents, 0);
  const creditsCents = activeMovements
    .filter((movement) => movement.direction === 'CREDIT')
    .reduce((sum, movement) => sum + movement.amountCents, 0);
  const pendingCents = activeMovements
    .filter((movement) => movement.status === 'PENDING_APPROVAL')
    .reduce((sum, movement) => sum + movement.amountCents, 0);
  const isToday = dateKey === todayBusinessDateKey();
  const loading = employeesLoading || movementsLoading;

  return (
    <div className="daily-ledger">
      <section className="daily-toolbar" aria-label="Jornada de la libreta">
        <div className="daily-toolbar__title">
          <h1>Anotaciones del turno</h1>
          <span>{isToday ? 'Día en curso' : 'Consulta histórica'}</span>
        </div>

        <div className="daily-toolbar__actions">
          <label className="daily-search">
            <Search size={19} />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar empleado"
            />
          </label>
          <button
            type="button"
            className={onlyWithMovements ? 'is-active' : ''}
            onClick={() => setOnlyWithMovements((value) => !value)}
            aria-pressed={onlyWithMovements}
          >
            <Filter size={18} />
            <span>Con movimientos</span>
          </button>
        </div>
      </section>

      <section className="daily-context" aria-label="Fecha y sucursal">
        <label className="daily-branch-select">
          <span>Sucursal</span>
          <select
            value={activeBranchId ?? ''}
            onChange={(event) => setBranchId(event.target.value || undefined)}
          >
            {(branches ?? []).map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
        </label>

        <div className="daily-date-control">
          <button
            type="button"
            onClick={() => setDateKey((current) => addDaysToDateKey(current, -1))}
            aria-label="Día anterior"
          >
            <ChevronLeft size={21} />
          </button>
          <div>
            <CalendarDays size={20} />
            <strong>{formatFullSpanishDate(dateKey)}</strong>
          </div>
          <button
            type="button"
            onClick={() => setDateKey((current) => addDaysToDateKey(current, 1))}
            aria-label="Día siguiente"
          >
            <ChevronRight size={21} />
          </button>
          {!isToday ? (
            <button type="button" className="daily-today" onClick={() => setDateKey(todayBusinessDateKey())}>
              Hoy
            </button>
          ) : null}
        </div>

        <div className="daily-shift-state">
          <span />
          Turno abierto · {activeBranch?.name ?? 'Sucursal'}
        </div>
      </section>

      <section className="daily-sheet" aria-busy={loading}>
        {loading ? (
          <div className="daily-sheet__state">Preparando la libreta del día…</div>
        ) : visibleEmployees.length > 0 ? (
          visibleEmployees.map((employee, index) => {
            const summary = summaries.get(employee.id);
            return (
              <DailyEmployeeRow
                key={employee.id}
                employee={employee}
                movements={movementsByEmployee.get(employee.id) ?? []}
                balanceCents={summary?.balanceCents ?? 0}
                pendingCents={summary?.pendingApprovalCents ?? 0}
                categories={categories ?? []}
                expanded={employee.id === expandedEmployeeId}
                toneIndex={index}
                onToggle={() =>
                  setExpandedEmployeeId((current) => current === employee.id ? null : employee.id)
                }
              />
            );
          })
        ) : (
          <div className="daily-sheet__state">
            <ClipboardList size={30} />
            <strong>No hay empleados para mostrar</strong>
            <span>Cambia la sucursal o limpia el filtro de búsqueda.</span>
          </div>
        )}
      </section>

      <section className="daily-summary" aria-label="Resumen del día">
        <div className="daily-summary__item daily-summary__item--count">
          <ClipboardList size={25} />
          <strong>{activeMovements.length}</strong>
          <span>movimientos</span>
        </div>
        <div className="daily-summary__item daily-summary__item--charge">
          <span className="daily-summary__icon"><ArrowUp size={20} /></span>
          <div><span>Cargos del día</span><strong>{formatCentsToMXN(chargesCents)}</strong></div>
        </div>
        <div className="daily-summary__item daily-summary__item--credit">
          <span className="daily-summary__icon"><ArrowDown size={20} /></span>
          <div><span>Abonos del día</span><strong>{formatCentsToMXN(creditsCents)}</strong></div>
        </div>
        <div className="daily-summary__item daily-summary__item--pending">
          <span className="daily-summary__icon"><Clock3 size={20} /></span>
          <div><span>Pendientes del día</span><strong>{formatCentsToMXN(pendingCents)}</strong></div>
        </div>
        <button
          type="button"
          className="daily-refresh"
          onClick={() => void refetch()}
          disabled={isFetching}
          aria-label="Actualizar libreta"
        >
          <RefreshCw size={19} className={isFetching ? 'animate-spin' : ''} />
        </button>
      </section>
    </div>
  );
}
