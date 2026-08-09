import { useState } from 'react';
import { Plus, Tags } from 'lucide-react';
import { roleHasCapability, type MovementDirection } from '@libreta/shared';
import {
  useCreateMovementCategory,
  useMovementCategories,
  useSetMovementCategoryActive,
  type CreateMovementCategoryInput,
} from '../api';
import { useAuth } from '@/app/providers/AuthProvider';
import { ApiError } from '@/lib/api/client';
import { CATEGORY_COLOR_TOKENS, categoryColorStyles } from '@/lib/utils/categoryColors';
import { resolveIcon } from '@/lib/utils/icons';
import { cn } from '@/lib/utils/cn';

const EMPTY_FORM = {
  code: '',
  label: '',
  direction: 'CHARGE' as MovementDirection,
  iconName: 'Tag',
  colorToken: 'purple' as (typeof CATEGORY_COLOR_TOKENS)[number],
  requiresNote: false,
  requiresEvidence: false,
  requiresApproval: false,
};

/**
 * Catálogo de categorías de movimiento (Fase 3): dirección, icono, color y
 * reglas de nota/evidencia/aprobación. `direction` es inmutable después de
 * creada (§6) — por eso no hay edición en línea de categorías existentes,
 * solo alta y (des)activación.
 */
export function CategoriasPage() {
  const { user } = useAuth();
  const canManage = user ? roleHasCapability(user.role, 'category.manage') : false;

  const { data: categories, isLoading } = useMovementCategories(true);
  const createCategory = useCreateMovementCategory();
  const setActive = useSetMovementCategoryActive();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const body: CreateMovementCategoryInput = {
        code: form.code.trim().toUpperCase().replace(/\s+/g, '_'),
        label: form.label,
        direction: form.direction,
        iconName: form.iconName,
        colorToken: form.colorToken,
        requiresNote: form.requiresNote,
        requiresEvidence: form.requiresEvidence,
        requiresApproval: form.requiresApproval,
      };
      await createCategory.mutateAsync(body);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la categoría.');
    }
  };

  const PreviewIcon = resolveIcon(form.iconName);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-purple/10 text-purple">
            <Tags size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ink">Categorías de movimiento</h1>
            <p className="text-sm text-muted">Etiqueta, icono, color, dirección y reglas de nota/evidencia.</p>
          </div>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex h-10 items-center gap-1.5 rounded-control bg-success px-4 text-sm font-semibold text-white shadow-control hover:brightness-105"
          >
            <Plus size={16} /> Nueva
          </button>
        ) : null}
      </div>

      {showForm ? (
        <form
          onSubmit={(e) => void onCreate(e)}
          className="mb-5 space-y-3 rounded-card border border-line bg-surface p-5 shadow-control"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="catCode" className="mb-1.5 block text-sm font-medium text-ink">
                Código
              </label>
              <input
                id="catCode"
                required
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="OTRO_CARGO"
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
            <div>
              <label htmlFor="catLabel" className="mb-1.5 block text-sm font-medium text-ink">
                Etiqueta
              </label>
              <input
                id="catLabel"
                required
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Otro cargo"
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Dirección</p>
            <p className="mb-1.5 text-xs text-muted">
              No se puede cambiar después de crear la categoría.
            </p>
            <div className="flex gap-2">
              {(['CHARGE', 'CREDIT'] as MovementDirection[]).map((direction) => (
                <button
                  type="button"
                  key={direction}
                  onClick={() => setForm((f) => ({ ...f, direction }))}
                  className={cn(
                    'flex-1 rounded-control border px-3 py-2 text-sm font-semibold',
                    form.direction === direction
                      ? 'border-brand-600 bg-brand-600/10 text-brand-600'
                      : 'border-line text-muted hover:bg-surface-soft',
                  )}
                >
                  {direction === 'CHARGE' ? 'Cargo (aumenta el saldo)' : 'Abono (reduce el saldo)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label htmlFor="catIcon" className="mb-1.5 block text-sm font-medium text-ink">
                Icono (nombre de lucide-react)
              </label>
              <input
                id="catIcon"
                required
                value={form.iconName}
                onChange={(e) => setForm((f) => ({ ...f, iconName: e.target.value }))}
                placeholder="Tag"
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
            <div
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-control',
                categoryColorStyles(form.colorToken).bg,
                categoryColorStyles(form.colorToken).text,
              )}
              title="Vista previa"
            >
              <PreviewIcon size={20} />
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Color</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_TOKENS.map((token) => {
                const styles = categoryColorStyles(token);
                return (
                  <button
                    type="button"
                    key={token}
                    onClick={() => setForm((f) => ({ ...f, colorToken: token }))}
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-full border-2',
                      styles.bg,
                      form.colorToken === token ? 'border-ink' : 'border-transparent',
                    )}
                    title={token}
                  >
                    <span className={cn('h-3 w-3 rounded-full', styles.text.replace('text-', 'bg-'))} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.requiresNote}
                onChange={(e) => setForm((f) => ({ ...f, requiresNote: e.target.checked }))}
                className="h-4 w-4 rounded border-line"
              />
              Requiere nota
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.requiresEvidence}
                onChange={(e) => setForm((f) => ({ ...f, requiresEvidence: e.target.checked }))}
                className="h-4 w-4 rounded border-line"
              />
              Requiere evidencia
            </label>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) => setForm((f) => ({ ...f, requiresApproval: e.target.checked }))}
                className="h-4 w-4 rounded border-line"
              />
              Requiere aprobación
            </label>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <button
            type="submit"
            disabled={createCategory.isPending}
            className="h-10 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60"
          >
            {createCategory.isPending ? 'Creando…' : 'Crear categoría'}
          </button>
        </form>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted">Cargando…</p>
      ) : (
        <div className="space-y-2.5">
          {categories?.map((category) => {
            const Icon = resolveIcon(category.iconName);
            const styles = categoryColorStyles(category.colorToken);
            return (
              <div
                key={category.id}
                className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-control"
              >
                <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-full', styles.bg, styles.text)}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">
                    {category.label}{' '}
                    <span className="font-mono text-xs font-normal text-muted">{category.code}</span>
                  </p>
                  <p className="text-sm text-muted">
                    {category.direction === 'CHARGE' ? 'Cargo' : 'Abono'}
                    {category.system ? ' · Sistema' : ''}
                    {category.requiresApproval ? ' · Requiere aprobación' : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={cn(
                      'rounded-pill px-2.5 py-1 text-xs font-semibold',
                      category.active ? 'bg-success-soft text-success' : 'bg-line text-muted',
                    )}
                  >
                    {category.active ? 'Activa' : 'Inactiva'}
                  </span>
                  {canManage ? (
                    <button
                      type="button"
                      onClick={() => setActive.mutate({ id: category.id, active: !category.active })}
                      disabled={setActive.isPending || (category.system && category.active)}
                      title={
                        category.system && category.active
                          ? 'Las categorías del sistema no se pueden desactivar.'
                          : undefined
                      }
                      className="rounded-control border border-line px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {category.active ? 'Desactivar' : 'Reactivar'}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
