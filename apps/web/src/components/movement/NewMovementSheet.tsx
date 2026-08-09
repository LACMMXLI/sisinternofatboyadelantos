import { useState } from 'react';
import { X } from 'lucide-react';
import { useCreateMovement } from '@/features/libreta/api';
import type { MovementCategoryView } from '@/features/configuracion/api';
import { ApiError } from '@/lib/api/client';
import { MoneyInput } from './MoneyInput';
import { resolveIcon } from '@/lib/utils/icons';
import { categoryColorStyles } from '@/lib/utils/categoryColors';
import { cn } from '@/lib/utils/cn';

interface NewMovementSheetProps {
  employeeId: string;
  employeeDisplayName: string;
  branchId: string;
  categories: MovementCategoryView[];
  initialCategoryId?: string;
  onClose: () => void;
}

/**
 * Alta rápida de movimiento (§4.5, §7 `POST /movements`). Overlay simple
 * propio (sin librería de diálogos) — consistente con el resto de la app,
 * que tampoco usa componentes de UI de terceros más allá de lucide-react.
 */
export function NewMovementSheet({
  employeeId,
  employeeDisplayName,
  branchId,
  categories,
  initialCategoryId,
  onClose,
}: NewMovementSheetProps) {
  const createMovement = useCreateMovement();

  const [categoryId, setCategoryId] = useState(initialCategoryId ?? categories[0]?.id ?? '');
  const [amountCents, setAmountCents] = useState(0);
  const [concept, setConcept] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!categoryId) {
      setError('Elige una categoría.');
      return;
    }
    if (amountCents <= 0) {
      setError('Captura un monto mayor a cero.');
      return;
    }
    if (selectedCategory?.requiresNote && !note.trim()) {
      setError('Esta categoría requiere una nota.');
      return;
    }
    try {
      await createMovement.mutateAsync({
        employeeId,
        branchId,
        categoryId,
        amountCents,
        concept: concept.trim() || selectedCategory?.label || 'Movimiento',
        note: note.trim() || undefined,
        idempotencyKey: crypto.randomUUID(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el movimiento.');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4">
      <div className="max-h-[90vh] w-full overflow-y-auto rounded-t-card border border-line bg-surface p-5 shadow-panel sm:max-w-md sm:rounded-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Nuevo movimiento</h2>
            <p className="text-sm text-muted">{employeeDisplayName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-control text-muted hover:bg-surface-soft hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink">Categoría</p>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((category) => {
                const Icon = resolveIcon(category.iconName);
                const styles = categoryColorStyles(category.colorToken);
                const selected = category.id === categoryId;
                return (
                  <button
                    type="button"
                    key={category.id}
                    onClick={() => {
                      setCategoryId(category.id);
                      if (!concept) setConcept(category.label);
                    }}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-control border p-2 text-center',
                      selected ? 'border-brand-600 bg-brand-600/10' : 'border-line hover:bg-surface-soft',
                    )}
                  >
                    <span className={cn('grid h-8 w-8 place-items-center rounded-full', styles.bg, styles.text)}>
                      <Icon size={16} />
                    </span>
                    <span className="line-clamp-2 text-[11px] font-semibold text-ink">{category.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="movementAmount" className="mb-1.5 block text-sm font-medium text-ink">
              Monto
            </label>
            <MoneyInput id="movementAmount" valueCents={amountCents} onChangeCents={setAmountCents} autoFocus />
          </div>

          <div>
            <label htmlFor="movementConcept" className="mb-1.5 block text-sm font-medium text-ink">
              Concepto
            </label>
            <input
              id="movementConcept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder={selectedCategory?.label ?? 'Concepto'}
              className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            />
          </div>

          {selectedCategory?.requiresNote ? (
            <div>
              <label htmlFor="movementNote" className="mb-1.5 block text-sm font-medium text-ink">
                Nota (requerida por esta categoría)
              </label>
              <textarea
                id="movementNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full rounded-control border border-line bg-surface-soft px-3.5 py-2 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
          ) : null}

          {selectedCategory?.requiresApproval ? (
            <p className="rounded-control bg-warning-soft px-3 py-2 text-xs text-warning">
              Esta categoría requiere aprobación: el movimiento quedará pendiente hasta que alguien
              con permiso lo apruebe.
            </p>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={createMovement.isPending}
            className="flex h-11 w-full items-center justify-center rounded-control bg-brand-600 text-sm font-semibold text-white shadow-control hover:brightness-105 disabled:opacity-60"
          >
            {createMovement.isPending ? 'Guardando…' : 'Registrar movimiento'}
          </button>
        </form>
      </div>
    </div>
  );
}
