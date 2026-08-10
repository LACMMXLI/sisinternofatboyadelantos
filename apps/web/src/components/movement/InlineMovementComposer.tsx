import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Save } from 'lucide-react';
import type { MovementCategoryView } from '@/features/configuracion/api';
import { useCreateMovement } from '@/features/libreta/api';
import { ApiError } from '@/lib/api/client';
import { categoryColorStyles } from '@/lib/utils/categoryColors';
import { cn } from '@/lib/utils/cn';
import { resolveIcon } from '@/lib/utils/icons';
import { MoneyInput } from './MoneyInput';

interface InlineMovementComposerProps {
  employeeId: string;
  employeeName: string;
  branchId: string | undefined;
  categories: MovementCategoryView[];
}

export function InlineMovementComposer({
  employeeId,
  employeeName,
  branchId,
  categories,
}: InlineMovementComposerProps) {
  const createMovement = useCreateMovement();
  const [categoryId, setCategoryId] = useState('');
  const [amountCents, setAmountCents] = useState(0);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [amountResetKey, setAmountResetKey] = useState(0);

  useEffect(() => {
    if (!categories.some((category) => category.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? '');
    }
  }, [categories, categoryId]);

  useEffect(() => {
    setAmountCents(0);
    setAmountResetKey((key) => key + 1);
    setNote('');
    setError(null);
    setSavedMessage(null);
  }, [employeeId]);

  const selectedCategory = categories.find((category) => category.id === categoryId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSavedMessage(null);

    if (!branchId) {
      setError('No se pudo determinar la sucursal del empleado.');
      return;
    }
    if (!selectedCategory) {
      setError('Selecciona una categoría.');
      return;
    }
    if (amountCents <= 0) {
      setError('Captura un importe mayor a cero.');
      return;
    }
    if (selectedCategory.requiresNote && !note.trim()) {
      setError('Esta categoría requiere una nota.');
      return;
    }

    try {
      await createMovement.mutateAsync({
        employeeId,
        branchId,
        categoryId: selectedCategory.id,
        amountCents,
        concept: note.trim() || selectedCategory.label,
        note: note.trim() || undefined,
        idempotencyKey: crypto.randomUUID(),
      });
      setAmountCents(0);
      setAmountResetKey((key) => key + 1);
      setNote('');
      setSavedMessage(
        selectedCategory.requiresApproval
          ? 'Renglón guardado y enviado a aprobación.'
          : 'Renglón guardado en la libreta.',
      );
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo guardar el renglón.');
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.requestSubmit();
        }
      }}
      className="daily-composer"
    >
      <div className="daily-composer__intro">
        <span>Agregar siguiente anotación a</span>
        <strong>{employeeName}</strong>
      </div>

      <div className="daily-composer__categories" aria-label="Categoría del movimiento">
        {categories.map((category) => {
          const Icon = resolveIcon(category.iconName);
          const tone = categoryColorStyles(category.colorToken);
          const selected = category.id === categoryId;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                setCategoryId(category.id);
                setSavedMessage(null);
              }}
              className={cn('daily-category', selected && 'daily-category--selected')}
              aria-pressed={selected}
            >
              <span className={cn('daily-category__icon', tone.bg, tone.text)}>
                <Icon size={20} strokeWidth={2} />
              </span>
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>

      <label className="daily-composer__amount">
        <span>Importe</span>
        <MoneyInput
          key={amountResetKey}
          valueCents={amountCents}
          onChangeCents={setAmountCents}
        />
      </label>

      <label className="daily-composer__note">
        <span>Nota {selectedCategory?.requiresNote ? '(requerida)' : '(opcional)'}</span>
        <input
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ej. Taxi al banco, material…"
          maxLength={120}
        />
        <small>Enter para nota rápida</small>
      </label>

      <div className="daily-composer__submit">
        <button type="submit" disabled={createMovement.isPending}>
          <Save size={18} />
          {createMovement.isPending ? 'Guardando…' : 'Guardar renglón'}
        </button>
        <small>Ctrl + Enter para guardar</small>
      </div>

      {error ? (
        <p className="daily-composer__feedback daily-composer__feedback--error">
          <AlertCircle size={16} /> {error}
        </p>
      ) : null}
      {savedMessage ? (
        <p className="daily-composer__feedback daily-composer__feedback--success">
          <CheckCircle2 size={16} /> {savedMessage}
        </p>
      ) : null}
    </form>
  );
}
