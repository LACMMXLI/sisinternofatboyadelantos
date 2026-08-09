import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { avatarColorFor, initialsFrom } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils/cn';

export interface EmployeeComboboxOption {
  id: string;
  displayName: string;
  jobTitle: string;
  employeeNumber: string;
}

interface EmployeeComboboxProps {
  employees: EmployeeComboboxOption[];
  value: string | null;
  onChange: (employeeId: string | null) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Búsqueda/selector de empleado para la captura rápida (§3 de la
 * corrección): primer paso obligatorio del renglón "empleado → categoría →
 * monto → nota → guardar". Reemplaza la columna fija de empleados de la
 * pantalla anterior — la búsqueda vive aquí, integrada a la hoja.
 */
export function EmployeeCombobox({
  employees,
  value,
  onChange,
  placeholder = 'Buscar empleado por nombre o número…',
  autoFocus,
}: EmployeeComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = employees.find((e) => e.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees.slice(0, 8);
    return employees
      .filter(
        (e) =>
          e.displayName.toLowerCase().includes(q) ||
          e.employeeNumber.toLowerCase().includes(q) ||
          e.jobTitle.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [employees, query]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (selected) {
    const avatarColor = avatarColorFor(selected.displayName);
    return (
      <div className="flex h-12 items-center gap-2.5 rounded-control border border-brand-500 bg-brand-600/8 px-3">
        <div
          className={cn(
            'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold',
            avatarColor.bg,
            avatarColor.text,
          )}
        >
          {initialsFrom(selected.displayName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{selected.displayName}</p>
          <p className="truncate text-xs text-muted">{selected.jobTitle}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            setQuery('');
          }}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-control text-muted hover:bg-surface hover:text-ink"
          aria-label="Cambiar empleado"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <label className="relative block">
        <span className="sr-only">Buscar empleado</span>
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="employee-combobox-list"
          autoFocus={autoFocus}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={placeholder}
          className="h-12 w-full rounded-control border border-line bg-surface-soft pl-10 pr-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
        />
      </label>

      {open ? (
        <div
          id="employee-combobox-list"
          role="listbox"
          className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-control border border-line bg-surface p-1.5 shadow-panel"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">Sin resultados para «{query}».</p>
          ) : (
            filtered.map((emp) => {
              const avatarColor = avatarColorFor(emp.displayName);
              return (
                <button
                  key={emp.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  onClick={() => {
                    onChange(emp.id);
                    setQuery('');
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-left hover:bg-surface-soft"
                >
                  <div
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold',
                      avatarColor.bg,
                      avatarColor.text,
                    )}
                  >
                    {initialsFrom(emp.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{emp.displayName}</p>
                    <p className="truncate text-xs text-muted">
                      {emp.jobTitle} · {emp.employeeNumber}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
