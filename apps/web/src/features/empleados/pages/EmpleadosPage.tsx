import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { roleHasCapability } from '@libreta/shared';
import { useEmployees, useCreateEmployee, type EmployeeInput } from '../api';
import { useBranches } from '@/features/configuracion/api';
import { useAuth } from '@/app/providers/AuthProvider';
import { ApiError } from '@/lib/api/client';
import { avatarColorFor, initialsFrom } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils/cn';

type ActiveFilter = 'active' | 'inactive' | 'all';

const EMPTY_FORM = {
  employeeNumber: '',
  firstName: '',
  lastName: '',
  jobTitle: '',
  baseSalary: '',
  primaryBranchId: '',
  additionalBranchIds: [] as string[],
};

/**
 * Administración de empleados (Fase 3): búsqueda tolerante, filtro por
 * sucursal/estado, alta y baja/reactivación lógica, y sueldo por periodo de
 * nómina (corrección 2026-08-09, decisión del usuario: el negocio adelanta
 * el sueldo semanal en efectivo y necesita saber cuánto le queda por pagar
 * a cada empleado en su corte — ver `IMPLEMENTATION_PLAN.md`).
 */
export function EmpleadosPage() {
  const { user } = useAuth();
  const canManage = user ? roleHasCapability(user.role, 'employee.manage') : false;

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: branches } = useBranches();
  const { data: employees, isLoading } = useEmployees({
    search: search || undefined,
    branchId: branchId || undefined,
    active: activeFilter === 'all' ? undefined : activeFilter === 'active',
  });
  const createEmployee = useCreateEmployee();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const salaryCents = form.baseSalary.trim()
        ? Math.round(Number.parseFloat(form.baseSalary) * 100)
        : undefined;
      const body: EmployeeInput = {
        employeeNumber: form.employeeNumber,
        firstName: form.firstName,
        lastName: form.lastName,
        jobTitle: form.jobTitle || undefined,
        baseSalaryCents: salaryCents != null && Number.isFinite(salaryCents) ? salaryCents : undefined,
        primaryBranchId: form.primaryBranchId,
        additionalBranchIds: form.additionalBranchIds,
      };
      await createEmployee.mutateAsync(body);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el empleado.');
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600/10 text-brand-600">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink">Empleados</h1>
            <p className="text-sm text-muted">Alta, edición, baja lógica y asignación de sucursales.</p>
          </div>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex h-10 items-center gap-1.5 rounded-control bg-success px-4 text-sm font-semibold text-white shadow-control hover:brightness-105"
          >
            <Plus size={16} /> Nuevo
          </button>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <label className="relative flex-1 min-w-[200px]">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o número…"
            className="h-10 w-full rounded-control border border-line bg-surface pl-9 pr-3 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
          />
        </label>
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="h-10 rounded-control border border-line bg-surface px-3 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          <option value="">Todas las sucursales</option>
          {branches?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
          className="h-10 rounded-control border border-line bg-surface px-3 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
        >
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
          <option value="all">Todos</option>
        </select>
      </div>

      {showForm ? (
        <form
          onSubmit={(e) => void onCreate(e)}
          className="mb-5 space-y-3 rounded-card border border-line bg-surface p-5 shadow-control"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="employeeNumber" className="mb-1.5 block text-sm font-medium text-ink">
                Número de empleado
              </label>
              <input
                id="employeeNumber"
                required
                value={form.employeeNumber}
                onChange={(e) => setForm((f) => ({ ...f, employeeNumber: e.target.value }))}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
            <div>
              <label htmlFor="jobTitle" className="mb-1.5 block text-sm font-medium text-ink">
                Puesto (opcional)
              </label>
              <input
                id="jobTitle"
                value={form.jobTitle}
                onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="baseSalary" className="mb-1.5 block text-sm font-medium text-ink">
              Sueldo por periodo de nómina (opcional)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-muted">
                $
              </span>
              <input
                id="baseSalary"
                type="text"
                inputMode="decimal"
                value={form.baseSalary}
                onChange={(e) =>
                  setForm((f) => ({ ...f, baseSalary: e.target.value.replace(/[^0-9.]/g, '') }))
                }
                placeholder="0.00"
                className="h-11 w-full rounded-control border border-line bg-surface-soft pl-7 pr-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
            <p className="mt-1 text-xs text-muted">
              Sueldo semanal/quincenal (según la frecuencia de nómina del negocio). No calcula ISR ni IMSS — solo sirve
              para estimar el neto a pagar y avisar si los adelantos ya lo superan.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-ink">
                Nombre(s)
              </label>
              <input
                id="firstName"
                required
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-ink">
                Apellido(s)
              </label>
              <input
                id="lastName"
                required
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="primaryBranchId" className="mb-1.5 block text-sm font-medium text-ink">
              Sucursal principal
            </label>
            <select
              id="primaryBranchId"
              required
              value={form.primaryBranchId}
              onChange={(e) => setForm((f) => ({ ...f, primaryBranchId: e.target.value }))}
              className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              <option value="" disabled>
                Selecciona una sucursal
              </option>
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Sucursales adicionales (opcional)</p>
            <div className="flex flex-wrap gap-2">
              {branches
                ?.filter((b) => b.id !== form.primaryBranchId)
                .map((b) => {
                  const checked = form.additionalBranchIds.includes(b.id);
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          additionalBranchIds: checked
                            ? f.additionalBranchIds.filter((id) => id !== b.id)
                            : [...f.additionalBranchIds, b.id],
                        }))
                      }
                      className={cn(
                        'rounded-pill border px-3 py-1.5 text-xs font-semibold',
                        checked
                          ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                          : 'border-line text-muted hover:bg-surface-soft',
                      )}
                    >
                      {b.name}
                    </button>
                  );
                })}
            </div>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={createEmployee.isPending}
            className="h-10 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {createEmployee.isPending ? 'Creando…' : 'Crear empleado'}
          </button>
        </form>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : employees?.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-muted">
          No hay empleados que coincidan con la búsqueda o los filtros.
        </p>
      ) : (
        <div className="space-y-2.5">
          {employees?.map((emp) => {
            const avatarColor = avatarColorFor(emp.displayName);
            return (
              <Link
                key={emp.id}
                to={`/app/empleados/${emp.id}`}
                className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-control transition hover:border-brand-500/50 hover:bg-surface-soft"
              >
                <div
                  className={cn(
                    'grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold',
                    avatarColor.bg,
                    avatarColor.text,
                  )}
                >
                  {initialsFrom(emp.displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {emp.displayName}{' '}
                    <span className="font-mono text-xs font-normal text-muted">{emp.employeeNumber}</span>
                  </p>
                  <p className="truncate text-sm text-muted">
                    {emp.jobTitle || 'Sin puesto asignado'} · {emp.primaryBranch.name}
                    {emp.additionalBranches.length > 0
                      ? ` +${emp.additionalBranches.length} sucursal${emp.additionalBranches.length > 1 ? 'es' : ''}`
                      : ''}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-pill px-2.5 py-1 text-xs font-semibold',
                    emp.active ? 'bg-success-soft text-success' : 'bg-line text-muted',
                  )}
                >
                  {emp.active ? 'Activo' : 'Inactivo'}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
