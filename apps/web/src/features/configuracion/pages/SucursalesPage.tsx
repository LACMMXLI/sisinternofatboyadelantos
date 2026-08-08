import { useState } from 'react';
import { Plus, Store } from 'lucide-react';
import { useBranches, useCreateBranch, useSetBranchActive } from '../api';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';

export function SucursalesPage() {
  const { data: branches, isLoading } = useBranches();
  const createBranch = useCreateBranch();
  const setActive = useSetBranchActive();

  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createBranch.mutateAsync({ code, name, address: address || undefined });
      setCode('');
      setName('');
      setAddress('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la sucursal.');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple/10 text-purple">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink">Sucursales</h1>
            <p className="text-sm text-muted">Nombre, código, dirección y estado.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex h-10 items-center gap-1.5 rounded-control bg-success px-4 text-sm font-semibold text-white shadow-control hover:brightness-105"
        >
          <Plus size={16} /> Nueva
        </button>
      </div>

      {showForm ? (
        <form
          onSubmit={(e) => void onCreate(e)}
          className="mb-5 space-y-3 rounded-card border border-line bg-surface p-5 shadow-control"
        >
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div>
              <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-ink">
                Código
              </label>
              <input
                id="code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={20}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3 text-sm uppercase outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
            <div>
              <label htmlFor="branchName" className="mb-1.5 block text-sm font-medium text-ink">
                Nombre
              </label>
              <input
                id="branchName"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
          </div>
          <div>
            <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-ink">
              Dirección (opcional)
            </label>
            <input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={createBranch.isPending}
            className="h-10 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {createBranch.isPending ? 'Creando…' : 'Crear sucursal'}
          </button>
        </form>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <div className="space-y-2.5">
          {branches?.map((branch) => (
            <div
              key={branch.id}
              className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface p-4 shadow-control"
            >
              <div>
                <p className="font-semibold text-ink">
                  {branch.name}{' '}
                  <span className="font-mono text-xs font-normal text-muted">{branch.code}</span>
                </p>
                {branch.address ? <p className="text-sm text-muted">{branch.address}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-pill px-2.5 py-1 text-xs font-semibold',
                    branch.active ? 'bg-success-soft text-success' : 'bg-line text-muted',
                  )}
                >
                  {branch.active ? 'Activa' : 'Inactiva'}
                </span>
                <button
                  type="button"
                  onClick={() => setActive.mutate({ id: branch.id, active: !branch.active })}
                  className="rounded-control border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft"
                >
                  {branch.active ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
