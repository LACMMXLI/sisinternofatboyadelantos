import { useState } from 'react';
import { KeyRound, LogOut, Plus, ShieldCheck } from 'lucide-react';
import { ROLES, ROLE_LABELS, type Role } from '@libreta/shared';
import {
  useBranches,
  useCreateUser,
  useLogoutAllUserSessions,
  useResetUserPassword,
  useSetUserActive,
  useUsers,
} from '../api';
import { ApiError } from '@/lib/api/client';
import { cn } from '@/lib/utils/cn';

export function UsuariosPage() {
  const { data: users, isLoading } = useUsers();
  const { data: branches } = useBranches();
  const createUser = useCreateUser();
  const setActive = useSetUserActive();
  const resetPassword = useResetUserPassword();
  const logoutAll = useLogoutAllUserSessions();

  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<Role>('CASHIER_RECORDER');
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<{ username: string; value: string } | null>(
    null,
  );

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await createUser.mutateAsync({ username, displayName, role, branchIds });
      setRevealedPassword({ username: result.user.username, value: result.tempPassword });
      setUsername('');
      setDisplayName('');
      setRole('CASHIER_RECORDER');
      setBranchIds([]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el usuario.');
    }
  };

  const onResetPassword = async (id: string, username_: string) => {
    const result = await resetPassword.mutateAsync(id);
    setRevealedPassword({ username: username_, value: result.tempPassword });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-pink/10 text-pink">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink">Usuarios</h1>
            <p className="text-sm text-muted">Rol, sucursales permitidas y estado.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="flex h-10 items-center gap-1.5 rounded-control bg-success px-4 text-sm font-semibold text-white shadow-control hover:brightness-105"
        >
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {revealedPassword ? (
        <div className="mb-5 rounded-card border border-warning/40 bg-warning-soft p-4 text-sm text-ink">
          <p className="font-semibold">
            Contraseña temporal para <span className="font-mono">{revealedPassword.username}</span>:
          </p>
          <p className="mt-1 font-mono text-base">{revealedPassword.value}</p>
          <p className="mt-1 text-xs text-muted">
            Compártela ahora por un canal seguro — no se volverá a mostrar.
          </p>
          <button
            type="button"
            onClick={() => setRevealedPassword(null)}
            className="mt-2 text-xs font-semibold text-brand-600 underline"
          >
            Entendido, ocultar
          </button>
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={(e) => void onCreate(e)}
          className="mb-5 space-y-3 rounded-card border border-line bg-surface p-5 shadow-control"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-ink">
                Usuario
              </label>
              <input
                id="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
            <div>
              <label htmlFor="displayName" className="mb-1.5 block text-sm font-medium text-ink">
                Nombre para mostrar
              </label>
              <input
                id="displayName"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-ink">
              Rol
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>

          {role !== 'OWNER_ADMIN' ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink">Sucursales permitidas</p>
              <div className="flex flex-wrap gap-2">
                {branches?.map((b) => {
                  const checked = branchIds.includes(b.id);
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() =>
                        setBranchIds((prev) =>
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
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={createUser.isPending}
            className="h-10 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {createUser.isPending ? 'Creando…' : 'Crear usuario'}
          </button>
        </form>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <div className="space-y-2.5">
          {users?.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-control sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-ink">
                  {u.displayName} <span className="font-mono text-xs font-normal text-muted">{u.username}</span>
                </p>
                <p className="text-sm text-muted">
                  {ROLE_LABELS[u.role]}
                  {u.branchAccess.length > 0
                    ? ` · ${u.branchAccess.map((a) => a.branch.name).join(', ')}`
                    : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-pill px-2.5 py-1 text-xs font-semibold',
                    u.active ? 'bg-success-soft text-success' : 'bg-line text-muted',
                  )}
                >
                  {u.active ? 'Activo' : 'Inactivo'}
                </span>
                <button
                  type="button"
                  onClick={() => void onResetPassword(u.id, u.username)}
                  className="flex items-center gap-1 rounded-control border border-line px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft"
                  title="Emitir contraseña temporal"
                >
                  <KeyRound size={14} /> Reset
                </button>
                <button
                  type="button"
                  onClick={() => logoutAll.mutate(u.id)}
                  className="flex items-center gap-1 rounded-control border border-line px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft"
                  title="Cerrar todas las sesiones"
                >
                  <LogOut size={14} /> Sesiones
                </button>
                <button
                  type="button"
                  onClick={() => setActive.mutate({ id: u.id, active: !u.active })}
                  className="rounded-control border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft"
                >
                  {u.active ? 'Desactivar' : 'Reactivar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
