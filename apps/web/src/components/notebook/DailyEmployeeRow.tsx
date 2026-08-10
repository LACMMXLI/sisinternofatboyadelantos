import { ChevronDown, Clock3, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MovementCategoryView } from '@/features/configuracion/api';
import type { EmployeeView } from '@/features/empleados/api';
import type { MovementView } from '@/features/libreta/api';
import { formatBusinessTime } from '@/lib/utils/date';
import { formatCentsToMXN } from '@/lib/utils/money';
import { resolveIcon } from '@/lib/utils/icons';
import { cn } from '@/lib/utils/cn';
import { InlineMovementComposer } from '@/components/movement/InlineMovementComposer';

interface DailyEmployeeRowProps {
  employee: EmployeeView;
  movements: MovementView[];
  balanceCents: number;
  pendingCents: number;
  categories: MovementCategoryView[];
  expanded: boolean;
  toneIndex: number;
  onToggle: () => void;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function DailyEmployeeRow({
  employee,
  movements,
  balanceCents,
  pendingCents,
  categories,
  expanded,
  toneIndex,
  onToggle,
}: DailyEmployeeRowProps) {
  const visibleMovements = movements.slice(0, 3);

  return (
    <article className={cn('daily-employee', expanded && 'daily-employee--expanded')}>
      <div className="daily-employee__row">
        <div className="daily-employee__identity">
          <span className={`daily-avatar daily-avatar--${toneIndex % 6}`}>
            {initials(employee.displayName)}
          </span>
          <div>
            <Link to={`/app/empleados/${employee.id}`}>{employee.displayName}</Link>
            <span>{employee.employeeNumber}</span>
          </div>
        </div>

        <dl className="daily-employee__figures">
          <div>
            <dt>Saldo</dt>
            <dd className={balanceCents > 0 ? 'is-charge' : balanceCents < 0 ? 'is-credit' : ''}>
              {formatCentsToMXN(Math.abs(balanceCents))}
            </dd>
          </div>
          <div>
            <dt>Pendiente</dt>
            <dd className={pendingCents > 0 ? 'is-pending' : ''}>{formatCentsToMXN(pendingCents)}</dd>
          </div>
        </dl>

        <div className="daily-employee__trail">
          {visibleMovements.length > 0 ? (
            visibleMovements.map((movement) => {
              const Icon = resolveIcon(movement.category.iconName);
              const isCredit = movement.direction === 'CREDIT';
              return (
                <div key={movement.id} className="daily-entry">
                  <time>{formatBusinessTime(movement.occurredAt)}</time>
                  <span className={cn('daily-entry__icon', isCredit && 'daily-entry__icon--credit')}>
                    <Icon size={18} />
                  </span>
                  <span className="daily-entry__concept">{movement.category.label}</span>
                  <strong className={isCredit ? 'is-credit' : 'is-charge'}>
                    {isCredit ? '+' : '−'}{formatCentsToMXN(movement.amountCents)}
                  </strong>
                  {movement.status === 'PENDING_APPROVAL' ? (
                    <span className="daily-pending-pill">Pendiente</span>
                  ) : null}
                </div>
              );
            })
          ) : (
            <span className="daily-empty-trail"><Clock3 size={20} /> Sin movimientos hoy</span>
          )}
        </div>

        <button
          type="button"
          className="daily-employee__toggle"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Cerrar' : 'Anotar movimiento para'} ${employee.displayName}`}
        >
          <Plus size={19} />
          <span>Anotar</span>
          <ChevronDown size={17} className={expanded ? 'rotate-180' : ''} />
        </button>
      </div>

      {expanded ? (
        <InlineMovementComposer
          employeeId={employee.id}
          employeeName={employee.displayName}
          branchId={employee.primaryBranchId}
          categories={categories}
        />
      ) : null}
    </article>
  );
}
