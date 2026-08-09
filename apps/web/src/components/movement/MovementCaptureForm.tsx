import { useState } from 'react';
import { Check, PenLine } from 'lucide-react';
import { useCreateMovement } from '@/features/libreta/api';
import type { MovementCategoryView } from '@/features/configuracion/api';
import { ApiError } from '@/lib/api/client';
import { MoneyInput } from './MoneyInput';
import { EmployeeCombobox, type EmployeeComboboxOption } from '@/components/employees/EmployeeCombobox';
import { resolveIcon } from '@/lib/utils/icons';
import { categoryColorStyles } from '@/lib/utils/categoryColors';
import { cn } from '@/lib/utils/cn';

interface MovementCaptureFormProps {
  employees: EmployeeComboboxOption[];
  categories: MovementCategoryView[];
  resolveBranchId: (employeeId: string) => string | undefined;
  /** Se llama tras cada guardado exitoso (p. ej. para cerrar el sheet en móvil). */
  onSaved?: () => void;
  initialEmployeeId?: string | null;
}

/**
 * Núcleo de la captura rápida (§3): "escribir el siguiente renglón de la
 * libreta". Orden obligatorio empleado → categoría → monto → nota opcional
 * → guardar. Se usa tanto en la franja integrada de escritorio/tablet
 * (`QuickCaptureBar`) como en el bottom sheet de móvil
 * (`MobileCaptureSheet`) — misma lógica, dos envoltorios visuales.
 */
export function MovementCaptureForm({
  employees,
  categories,
  resolveBranchId,
  onSaved,
  initialEmployeeId = null,
}: MovementCaptureFormProps) {
  const createMovement = useCreateMovement();

  const [employeeId, setEmployeeId] = useState<string | null>(initialEmployeeId);
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? '');
  const [amountCents, setAmountCents] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [amountResetKey, setAmountResetKey] = useState(0);

  const selectedEmployee = employees.find((e) => e.id === employeeId) ?? null;
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmation(null);
    if (!employeeId) {
      setError('Elige un empleado.');
      return;
    }
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
    const branchId = resolveBranchId(employeeId);
    if (!branchId) {
      setError('No se pudo determinar la sucursal del empleado.');
      return;
    }
    try {
      await createMovement.mutateAsync({
        employeeId,
        branchId,
        categoryId,
        amountCents,
        concept: note.trim() || selectedCategory?.label || 'Movimiento',
        note: note.trim() || undefined,
        idempotencyKey: crypto.randomUUID(),
      });
      setConfirmation(
        `Anotado: ${selectedEmployee?.displayName ?? ''} · ${selectedCategory?.label ?? ''} — ${
          selectedCategory?.requiresApproval ? 'pendiente de aprobación' : 'registrado'
        }.`,
      );
      // Limpia empleado, monto y nota; conserva categoría y sucursal para
      // agilizar el siguiente renglón (§3: "Anotar otro").
      setEmployeeId(null);
      setAmountCents(0);
      setAmountResetKey((k) => k + 1);
      setNote('');
      onSaved?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el movimiento.');
    }
  };

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">1. Empleado</p>
        <EmployeeCombobox employees={employees} value={employeeId} onChange={setEmployeeId} />
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold tracking-wide text-muted uppercase">2. Categoría</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {categories.map((category) => {
            const Icon = resolveIcon(category.iconName);
            const styles = categoryColorStyles(category.colorToken);
            const selected = category.id === categoryId;
            return (
              <button
                type="button"
                key={category.id}
                onClick={() => setCategoryId(category.id)}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-control border p-2 text-center transition',
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,180px)_1fr]">
        <div>
          <label htmlFor="captureAmount" className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase">
            3. Monto
          </label>
          <MoneyInput id="captureAmount" key={amountResetKey} valueCents={amountCents} onChangeCents={setAmountCents} />
        </div>

        <div>
          <label htmlFor="captureNote" className="mb-1.5 block text-xs font-semibold tracking-wide text-muted uppercase">
            4. Nota {selectedCategory?.requiresNote ? '(requerida)' : '(opcional)'}
          </label>
          <div className="relative">
            <PenLine size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
            <input
              id="captureNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={selectedCategory?.label ?? 'Concepto o nota'}
              className="h-12 w-full rounded-control border border-line bg-surface-soft pl-9 pr-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            />
          </div>
        </div>
      </div>

      {selectedCategory?.requiresApproval ? (
        <p className="rounded-control bg-warning-soft px-3 py-2 text-xs text-warning">
          Esta categoría requiere aprobación: el movimiento quedará pendiente hasta que alguien con
          permiso lo apruebe.
        </p>
      ) : null}

      {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}
      {confirmation ? (
        <p className="flex items-center gap-1.5 text-sm font-medium text-success">
          <Check size={15} /> {confirmation}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={createMovement.isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-control bg-success text-sm font-bold text-white shadow-control transition hover:brightness-105 disabled:opacity-60 sm:h-11 sm:w-auto sm:px-8"
      >
        {createMovement.isPending ? 'Guardando…' : 'Anotar movimiento'}
      </button>
    </form>
  );
}
