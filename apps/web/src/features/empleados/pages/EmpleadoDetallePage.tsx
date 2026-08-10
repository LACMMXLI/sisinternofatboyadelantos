import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { roleHasCapability } from '@libreta/shared';
import { useEmployee, useSetEmployeeActive, useUpdateEmployee } from '../api';
import { useBranches } from '@/features/configuracion/api';
import { useAuth } from '@/app/providers/AuthProvider';
import { ApiError } from '@/lib/api/client';
import { avatarColorFor, initialsFrom } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils/cn';

/**
 * Expediente de empleado (Fase 3): identidad, puesto, sucursales y
 * baja/reactivación lógica. El historial de saldo/movimientos llega con el
 * `LedgerModule` (Fase 4) — ver IMPLEMENTATION_PLAN.md.
 */
export function EmpleadoDetallePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { user } = useAuth();
  const canManage = user ? roleHasCapability(user.role, 'employee.manage') : false;

  const { data: employee, isLoading } = useEmployee(employeeId);
  const { data: branches } = useBranches();
  const updateEmployee = useUpdateEmployee();
  const setActive = useSetEmployeeActive();

  const [jobTitle, setJobTitle] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [primaryBranchId, setPrimaryBranchId] = useState('');
  const [additionalBranchIds, setAdditionalBranchIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!employee) return;
    setJobTitle(employee.jobTitle ?? '');
    setBaseSalary(employee.baseSalaryCents != null ? (employee.baseSalaryCents / 100).toString() : '');
    setPrimaryBranchId(employee.primaryBranchId);
    setAdditionalBranchIds(employee.additionalBranches.map((b) => b.branch.id));
  }, [employee]);

  if (isLoading) {
    return <p className="mx-auto max-w-2xl text-sm text-muted">Cargando…</p>;
  }

  if (!employee) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link to="/app/empleados" className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-600">
          <ArrowLeft size={15} /> Volver a empleados
        </Link>
        <p className="rounded-card border border-line bg-surface p-6 text-center text-sm text-muted">
          No se encontró el empleado.
        </p>
      </div>
    );
  }

  const avatarColor = avatarColorFor(employee.displayName);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const salaryCents = baseSalary.trim() ? Math.round(Number.parseFloat(baseSalary) * 100) : undefined;
      await updateEmployee.mutateAsync({
        id: employee.id,
        jobTitle: jobTitle || undefined,
        baseSalaryCents: salaryCents != null && Number.isFinite(salaryCents) ? salaryCents : undefined,
        primaryBranchId,
        additionalBranchIds,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar el empleado.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/app/empleados" className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-600">
        <ArrowLeft size={15} /> Volver a empleados
      </Link>

      <div className="mb-5 flex items-center gap-3">
        <div
          className={cn(
            'grid h-14 w-14 shrink-0 place-items-center rounded-full text-lg font-bold',
            avatarColor.bg,
            avatarColor.text,
          )}
        >
          {initialsFrom(employee.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold text-ink">{employee.displayName}</h1>
          <p className="text-sm text-muted">
            <span className="font-mono">{employee.employeeNumber}</span> · {employee.primaryBranch.name}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-pill px-2.5 py-1 text-xs font-semibold',
            employee.active ? 'bg-success-soft text-success' : 'bg-line text-muted',
          )}
        >
          {employee.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <form
        onSubmit={(e) => void onSave(e)}
        className="space-y-3 rounded-card border border-line bg-surface p-5 shadow-control"
      >
        <fieldset disabled={!canManage} className="space-y-3 disabled:opacity-70">
          <div>
            <label htmlFor="jobTitle" className="mb-1.5 block text-sm font-medium text-ink">
              Puesto
            </label>
            <input
              id="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            />
          </div>

          <div>
            <label htmlFor="baseSalary" className="mb-1.5 block text-sm font-medium text-ink">
              Sueldo por periodo de nómina
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-semibold text-muted">
                $
              </span>
              <input
                id="baseSalary"
                type="text"
                inputMode="decimal"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value.replace(/[^0-9.]/g, ''))}
                placeholder="0.00"
                className="h-11 w-full rounded-control border border-line bg-surface-soft pl-7 pr-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="primaryBranchId" className="mb-1.5 block text-sm font-medium text-ink">
              Sucursal principal
            </label>
            <select
              id="primaryBranchId"
              value={primaryBranchId}
              onChange={(e) => setPrimaryBranchId(e.target.value)}
              className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              {branches?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Sucursales adicionales</p>
            <div className="flex flex-wrap gap-2">
              {branches
                ?.filter((b) => b.id !== primaryBranchId)
                .map((b) => {
                  const checked = additionalBranchIds.includes(b.id);
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() =>
                        setAdditionalBranchIds((prev) =>
                          checked ? prev.filter((id) => id !== b.id) : [...prev, b.id],
                        )
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
        </fieldset>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {saved ? <p className="text-sm text-success">Cambios guardados.</p> : null}

        {canManage ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={updateEmployee.isPending}
              className="h-10 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
            >
              {updateEmployee.isPending ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              onClick={() => setActive.mutate({ id: employee.id, active: !employee.active })}
              disabled={setActive.isPending}
              className="h-10 rounded-control border border-line px-4 text-sm font-semibold text-ink hover:bg-surface-soft disabled:opacity-60"
            >
              {employee.active ? 'Dar de baja' : 'Reactivar'}
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
