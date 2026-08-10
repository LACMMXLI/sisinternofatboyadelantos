import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { EmployeeList, type EmployeeListEntry } from '@/components/employees/EmployeeList';
import { EmployeeWorkspacePanel } from '@/components/employees/EmployeeWorkspacePanel';
import { NotebookSpine } from '@/components/notebook/NotebookSpine';
import { MobileCaptureSheet } from '@/components/movement/MobileCaptureSheet';
import { useEmployees } from '@/features/empleados/api';
import { useMovementCategories, useBranches } from '@/features/configuracion/api';
import { useEmployeeBalances } from '@/features/libreta/api';

/**
 * Pantalla insignia — "Libreta" (corrección 2026-08-09 #2, decisión del
 * usuario). Vuelve al modelo mental de dos hojas: la izquierda, angosta,
 * lista TODOS los empleados; la derecha, grande, abre en el empleado
 * elegido con su saldo, desglose e historial completo. Entre ambas,
 * `NotebookSpine` dibuja el "resorte" de argollas que simula el doblez
 * físico de una libreta abierta. Reemplaza el intento de "libreta del día"
 * (ver commit c6a3de8): ese modelo centraba la pantalla en el día, no en
 * el empleado, y dificultaba responder "¿cuánto lleva Fulano?" de un
 * vistazo — que es la pregunta que esta pantalla existe para responder.
 */
export function LibretaPage() {
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: branches } = useBranches();
  const activeBranchId = branchId ?? branches?.[0]?.id;
  const { data: employees } = useEmployees({
    active: true,
    branchId: activeBranchId,
    search: search || undefined,
  });
  const { data: categories } = useMovementCategories(false);

  const employeeIds = useMemo(() => (employees ?? []).map((e) => e.id), [employees]);
  const balances = useEmployeeBalances(employeeIds);

  const listEntries: EmployeeListEntry[] = useMemo(
    () =>
      (employees ?? []).map((e) => ({
        id: e.id,
        displayName: e.displayName,
        jobTitle: e.jobTitle || 'Sin puesto',
        balanceCents: balances.get(e.id) ?? 0,
        active: e.active,
      })),
    [employees, balances],
  );

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

  // Abre la libreta con alguien ya elegido: evita una hoja derecha vacía
  // en la primera carga y tras filtrar/buscar si la selección quedó fuera
  // de la lista visible.
  useEffect(() => {
    if (listEntries.length === 0) return;
    const stillVisible = listEntries.some((e) => e.id === selectedEmployeeId);
    if (!selectedEmployeeId || !stillVisible) {
      setSelectedEmployeeId(listEntries[0].id);
    }
  }, [listEntries, selectedEmployeeId]);

  return (
    <div className="space-y-3.5 pb-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg font-bold text-ink">Libreta</h1>
          <p className="text-sm text-muted">Elige un empleado para ver su saldo e historial.</p>
        </div>
        {branches && branches.length > 1 ? (
          <select
            value={activeBranchId ?? ''}
            onChange={(e) => setBranchId(e.target.value || undefined)}
            className="h-10 rounded-control border border-line bg-surface px-3 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="flex flex-col gap-2.5 xl:flex-row xl:items-stretch xl:gap-0">
        {/* Hoja izquierda: angosta, todos los empleados (§ referencia visual 1) */}
        <div className="flex w-full flex-col gap-2.5 xl:w-[300px] xl:shrink-0">
          <label className="relative">
            <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar empleado…"
              className="h-10 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            />
          </label>
          <EmployeeList
            employees={listEntries}
            selectedId={selectedEmployeeId}
            onSelect={setSelectedEmployeeId}
            onNewMovement={() => setCaptureOpen(true)}
          />
        </div>

        {/* Resorte central: solo visible cuando ambas hojas conviven lado a lado */}
        <NotebookSpine />

        {/* Hoja derecha: grande, detalle del empleado elegido */}
        <div className="w-full xl:flex-1">
          <EmployeeWorkspacePanel employeeId={selectedEmployeeId} onNewMovement={() => setCaptureOpen(true)} />
        </div>
      </div>

      {captureOpen ? (
        <MobileCaptureSheet
          employees={employeeOptions}
          categories={categories ?? []}
          resolveBranchId={resolveBranchId}
          initialEmployeeId={selectedEmployeeId}
          onClose={() => setCaptureOpen(false)}
        />
      ) : null}
    </div>
  );
}
