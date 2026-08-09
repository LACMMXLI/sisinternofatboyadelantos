import { avatarColorFor, initialsFrom } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils/cn';

export interface RecentEmployeeEntry {
  id: string;
  displayName: string;
}

interface RecentEmployeesStripProps {
  employees: RecentEmployeeEntry[];
  onSelect: (employeeId: string) => void;
}

/**
 * Franja compacta y opcional de empleados con anotaciones hoy (§5 de la
 * corrección): reemplaza la columna fija de empleados — un atajo, no la
 * fuente principal de navegación (esa es la búsqueda de la captura rápida).
 */
export function RecentEmployeesStrip({ employees, onSelect }: RecentEmployeesStripProps) {
  if (employees.length === 0) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="shrink-0 text-xs font-semibold tracking-wide text-muted uppercase">Hoy:</span>
      {employees.map((emp) => {
        const avatarColor = avatarColorFor(emp.displayName);
        return (
          <button
            key={emp.id}
            type="button"
            onClick={() => onSelect(emp.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-pill border border-line bg-surface py-1 pr-3 pl-1 text-xs font-semibold text-ink hover:bg-surface-soft"
          >
            <span
              className={cn('grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold', avatarColor.bg, avatarColor.text)}
            >
              {initialsFrom(emp.displayName)}
            </span>
            {emp.displayName.split(' ')[0]}
          </button>
        );
      })}
    </div>
  );
}
