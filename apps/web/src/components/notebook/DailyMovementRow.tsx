import { useEffect, useRef, useState } from 'react';
import { MoreVertical, Check, X as XIcon, Undo2 } from 'lucide-react';
import { roleHasCapability } from '@libreta/shared';
import { formatCentsToMXN } from '@/lib/utils/money';
import { formatBusinessTime } from '@/lib/utils/date';
import { categoryColorStyles } from '@/lib/utils/categoryColors';
import { STATUS_LABELS, STATUS_PILL_CLASSES } from './statusPresentation';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/app/providers/AuthProvider';
import { useApproveMovement, useRejectMovement, useReverseMovement, type MovementView } from '@/features/libreta/api';

interface DailyMovementRowProps {
  movement: MovementView;
  onEmployeeClick: (employeeId: string) => void;
}

function ActionsMenu({ movement }: { movement: MovementView }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const approve = useApproveMovement();
  const reject = useRejectMovement();
  const reverse = useReverseMovement();

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  const canApprove = user && roleHasCapability(user.role, 'movement.approve') && movement.status === 'PENDING_APPROVAL';
  const canReverse = user && roleHasCapability(user.role, 'movement.reverse') && movement.status === 'POSTED';

  if (!canApprove && !canReverse) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="grid h-8 w-8 place-items-center rounded-control text-muted hover:bg-surface-soft hover:text-ink"
        aria-label="Más opciones"
        aria-haspopup="menu"
      >
        <MoreVertical size={15} />
      </button>
      {open ? (
        <div role="menu" className="absolute top-full right-0 z-20 mt-1 w-48 rounded-control border border-line bg-surface p-1 shadow-panel">
          {canApprove ? (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  void approve.mutateAsync({ id: movement.id });
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-sm text-success hover:bg-success-soft"
              >
                <Check size={14} /> Aprobar
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  const reason = window.prompt('Motivo del rechazo:');
                  if (reason?.trim()) {
                    void reject.mutateAsync({ id: movement.id, reason: reason.trim() });
                  }
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-sm text-danger hover:bg-danger-soft"
              >
                <XIcon size={14} /> Rechazar
              </button>
            </>
          ) : null}
          {canReverse ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                const reason = window.prompt('Motivo de la reversa:');
                if (reason?.trim()) {
                  void reverse.mutateAsync({ id: movement.id, reason: reason.trim() });
                }
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-sm text-ink hover:bg-surface-soft"
            >
              <Undo2 size={14} /> Revertir
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Fila de la hoja diaria en escritorio/tablet (≥768px, oculta en móvil). */
export function DailyMovementRow({ movement, onEmployeeClick }: DailyMovementRowProps) {
  const isCharge = movement.direction === 'CHARGE';
  const pill = categoryColorStyles(movement.category.colorToken);
  return (
    <div className="grid grid-cols-[64px_1fr_112px_1fr_84px_84px_92px_88px_32px] items-center gap-2 border-b border-line/70 py-2 text-sm last:border-b-0">
      <div className="text-xs font-medium text-muted">{formatBusinessTime(movement.occurredAt)}</div>
      <button
        type="button"
        onClick={() => movement.employee && onEmployeeClick(movement.employee.id)}
        className="truncate text-left font-semibold text-ink hover:text-brand-600 hover:underline"
      >
        {movement.employee?.displayName ?? '—'}
      </button>
      <div>
        <span className={cn('inline-block truncate rounded-pill px-2 py-1 text-xs font-semibold', pill.bg, pill.text)}>
          {movement.category.label}
        </span>
      </div>
      <div className="truncate text-muted">{movement.concept}</div>
      <div className="text-right font-semibold tabular-nums text-danger">
        {isCharge ? formatCentsToMXN(movement.amountCents) : ''}
      </div>
      <div className="text-right font-semibold tabular-nums text-success">
        {!isCharge ? formatCentsToMXN(movement.amountCents) : ''}
      </div>
      <div>
        <span className={cn('inline-block rounded-pill px-2 py-1 text-[11px] font-semibold', STATUS_PILL_CLASSES[movement.status])}>
          {STATUS_LABELS[movement.status]}
        </span>
      </div>
      <div className="truncate text-xs text-muted">{movement.createdBy?.displayName ?? '—'}</div>
      <div className="justify-self-end">
        <ActionsMenu movement={movement} />
      </div>
    </div>
  );
}

/** Tarjeta de la hoja diaria en móvil (<768px): sin scroll horizontal. */
export function DailyMovementCard({ movement, onEmployeeClick }: DailyMovementRowProps) {
  const isCharge = movement.direction === 'CHARGE';
  const pill = categoryColorStyles(movement.category.colorToken);
  return (
    <div className="rounded-control border border-line bg-surface p-3 shadow-control">
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => movement.employee && onEmployeeClick(movement.employee.id)}
          className="text-left text-sm font-bold text-ink hover:text-brand-600"
        >
          {movement.employee?.displayName ?? '—'}
        </button>
        <span className={cn('shrink-0 font-bold tabular-nums', isCharge ? 'text-danger' : 'text-success')}>
          {isCharge ? '-' : '+'}
          {formatCentsToMXN(movement.amountCents)}
        </span>
      </div>
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <span className={cn('rounded-pill px-2 py-0.5 text-[11px] font-semibold', pill.bg, pill.text)}>
          {movement.category.label}
        </span>
        <span className={cn('rounded-pill px-2 py-0.5 text-[11px] font-semibold', STATUS_PILL_CLASSES[movement.status])}>
          {STATUS_LABELS[movement.status]}
        </span>
      </div>
      <p className="truncate text-xs text-muted">{movement.concept}</p>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted">
        <span>
          {formatBusinessTime(movement.occurredAt)} · {movement.createdBy?.displayName ?? '—'}
        </span>
        <ActionsMenu movement={movement} />
      </div>
    </div>
  );
}
