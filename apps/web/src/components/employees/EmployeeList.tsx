import { ListFilter, Plus, Users } from 'lucide-react';
import { EmployeeListItem } from './EmployeeListItem';
import type { MockEmployee } from '@/features/libreta/mockData';

interface EmployeeListProps {
  employees: MockEmployee[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewMovement: () => void;
}

/**
 * Columna izquierda de la libreta (§4.5, referencia visual 1): CTA "Nuevo
 * Movimiento", encabezado "Empleados (N)" y la lista. La búsqueda real y
 * el filtro por sucursal/estado llegan con datos reales en la Fase 3.
 */
export function EmployeeList({ employees, selectedId, onSelect, onNewMovement }: EmployeeListProps) {
  return (
    <section className="flex flex-col rounded-card border border-line bg-surface p-3 shadow-control xl:h-[calc(100vh-110px)] xl:min-h-[70vh]">
      <button
        type="button"
        onClick={onNewMovement}
        className="mb-2.5 flex h-11 shrink-0 items-center justify-center gap-2 rounded-control bg-brand-600 text-sm font-semibold text-white shadow-control transition hover:brightness-105"
      >
        <Plus size={18} /> Nuevo Movimiento
      </button>

      <div className="mb-1.5 flex shrink-0 items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <Users size={15} className="text-muted" />
          Empleados ({employees.length})
        </div>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded-control text-muted hover:bg-surface-soft hover:text-ink"
          aria-label="Filtrar"
        >
          <ListFilter size={15} />
        </button>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-0.5">
        {employees.map((emp) => (
          <EmployeeListItem
            key={emp.id}
            displayName={emp.displayName}
            jobTitle={emp.jobTitle}
            balanceCents={emp.balanceCents}
            active={emp.active}
            selected={emp.id === selectedId}
            onClick={() => onSelect(emp.id)}
          />
        ))}
      </div>

      <button
        type="button"
        className="mt-2 flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-control border border-line text-xs font-semibold text-ink hover:bg-surface-soft"
      >
        <Users size={14} /> Ver todos los empleados
      </button>
    </section>
  );
}
