import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { EmployeeCard } from '@/components/employees/EmployeeCard';
import { EmployeeWorkspacePanel } from '@/components/employees/EmployeeWorkspacePanel';
import { NotebookSpine } from '@/components/notebook/NotebookSpine';
import { MobileCaptureSheet } from '@/components/movement/MobileCaptureSheet';
import { useEmployees } from '@/features/empleados/api';
import { useMovementCategories, useBranches } from '@/features/configuracion/api';
import { useEmployeeBalances } from '@/features/libreta/api';

export interface EmployeeCardEntry {
  id: string;
  displayName: string;
  jobTitle: string;
  balanceCents: number;
  active: boolean;
  photoObjectKey?: string | null;
}

/**
 * LibretaPage — Pantalla principal de Libreta Digital (Sistema Stitch).
 *
 * Diseño:
 * - Search bar gigante (72px) en modo desktop
 * - Grid de empleados (1 col mobile, 2 col tablet, 3 col desktop)
 * - Cada tarjeta: EmployeeCard con imagen circular 160px, nombre grande, badge de puesto
 * - En desktop grande (xl): vista dual con workspace a la derecha
 *
 * Modo responsive:
 * - Mobile (sm): 1 columna + bottom nav
 * - Tablet (md-lg): 2 columnas
 * - Desktop (xl+): 3 columnas + workspace
 */
export function LibretaPage() {
  const [branchId, setBranchId] = useState<string | undefined>(undefined);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'dual'>('grid'); // Toggle entre grid y dual

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

  const cardEntries: EmployeeCardEntry[] = useMemo(
    () =>
      (employees ?? []).map((e) => ({
        id: e.id,
        displayName: e.displayName,
        jobTitle: e.jobTitle || 'Sin puesto',
        balanceCents: balances.get(e.id) ?? 0,
        active: e.active,
        photoObjectKey: e.photoObjectKey,
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

  // Abre la pantalla con alguien ya elegido
  useEffect(() => {
    if (cardEntries.length === 0) return;
    const stillVisible = cardEntries.some((e) => e.id === selectedEmployeeId);
    if (!selectedEmployeeId || !stillVisible) {
      setSelectedEmployeeId(cardEntries[0].id);
    }
  }, [cardEntries, selectedEmployeeId]);

  return (
    <div className="pb-6 pt-4">
      {/* Giant Search Bar - Desktop only */}
      <div className="w-full max-w-3xl mx-auto mt-8 mb-12 relative hidden md:block">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
            <Search size={32} className="text-muted group-focus-within:text-brand-600 transition-colors" />
          </div>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar empleado…"
            className="block w-full h-[72px] pl-20 pr-6 rounded-[16px] border-2 border-muted bg-surface-soft text-headline-md text-ink placeholder:text-muted shadow-control focus:border-brand-600 focus:ring-0 focus:shadow-panel transition-all duration-300 outline-none font-semibold"
          />
        </div>
      </div>

      {/* Branch selector - Mobile */}
      {branches && branches.length > 1 ? (
        <div className="px-4 mb-4 md:hidden">
          <select
            value={activeBranchId ?? ''}
            onChange={(e) => setBranchId(e.target.value || undefined)}
            className="h-10 rounded-control border border-muted bg-surface-soft px-3 text-sm outline-none focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/30 w-full text-ink"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {/* Modo: Grid o Dual (toggle for larger screens) */}
      <div className="hidden lg:flex justify-end px-6 mb-4 gap-2">
        <button
          onClick={() => setViewMode('grid')}
          className={`px-4 py-2 rounded-control font-semibold transition-all ${
            viewMode === 'grid'
              ? 'bg-brand-600 text-white'
              : 'bg-surface-soft text-ink hover:bg-muted'
          }`}
        >
          Grid View
        </button>
        <button
          onClick={() => setViewMode('dual')}
          className={`px-4 py-2 rounded-control font-semibold transition-all ${
            viewMode === 'dual'
              ? 'bg-brand-600 text-white'
              : 'bg-surface-soft text-ink hover:bg-muted'
          }`}
        >
          Detail View
        </button>
      </div>

      {/* Dual View: Left employee list + Right workspace (desktop xl+) */}
      {viewMode === 'dual' && (
        <div className="hidden xl:flex flex-col gap-2.5 lg:flex-row lg:items-stretch lg:gap-0">
          {/* Left: Employee grid (smaller) */}
          <div className="flex w-full flex-col gap-2.5 lg:w-[300px] lg:shrink-0">
            <label className="relative">
              <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar empleado…"
                className="h-10 w-full rounded-control border border-muted bg-surface-soft pl-9 pr-3 text-sm outline-none focus-visible:border-brand-600 focus-visible:ring-2 focus-visible:ring-brand-600/30 text-ink"
              />
            </label>
            <div className="flex-1 space-y-1 overflow-y-auto pr-0.5">
              {cardEntries.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setSelectedEmployeeId(emp.id)}
                  className={`flex w-full items-center gap-2.5 rounded-2xl border p-2 text-left transition-colors ${
                    emp.id === selectedEmployeeId
                      ? 'border-brand-600 bg-brand-600/10'
                      : 'border-transparent hover:bg-surface-soft text-ink'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-surface border border-muted flex items-center justify-center shrink-0 text-sm font-bold text-ink">
                    {emp.displayName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{emp.displayName}</p>
                    <p className="truncate text-xs text-muted">{emp.jobTitle}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Spine */}
          <NotebookSpine />

          {/* Right: Detail workspace */}
          <div className="w-full xl:flex-1">
            <EmployeeWorkspacePanel employeeId={selectedEmployeeId} onNewMovement={() => setCaptureOpen(true)} />
          </div>
        </div>
      )}

      {/* Grid View: Large employee cards (default for mobile/tablet, optional for desktop) */}
      {viewMode === 'grid' && (
        <div className="px-4 md:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cardEntries.map((emp) => (
              <EmployeeCard
                key={emp.id}
                displayName={emp.displayName}
                jobTitle={emp.jobTitle}
                balanceCents={emp.balanceCents}
                selected={emp.id === selectedEmployeeId}
                photoUrl={emp.photoObjectKey ?? undefined}
                onClick={() => {
                  setSelectedEmployeeId(emp.id);
                  setCaptureOpen(true); // Auto-open capture on employee select
                }}
              />
            ))}
          </div>
        </div>
      )}

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
