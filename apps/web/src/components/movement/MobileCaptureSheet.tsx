import { X } from 'lucide-react';
import { MovementCaptureForm } from './MovementCaptureForm';
import type { MovementCategoryView } from '@/features/configuracion/api';
import type { EmployeeComboboxOption } from '@/components/employees/EmployeeCombobox';

interface MobileCaptureSheetProps {
  employees: EmployeeComboboxOption[];
  categories: MovementCategoryView[];
  resolveBranchId: (employeeId: string) => string | undefined;
  onClose: () => void;
}

/**
 * Captura rápida en móvil (§7 responsive): bottom sheet con el mismo
 * `MovementCaptureForm` y el mismo orden obligatorio que en escritorio —
 * solo cambia el envoltorio visual, no la lógica.
 */
export function MobileCaptureSheet({ employees, categories, resolveBranchId, onClose }: MobileCaptureSheetProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-ink/40" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-card border border-line bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-panel">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">Anotar movimiento</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-control text-muted hover:bg-surface-soft hover:text-ink"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <MovementCaptureForm employees={employees} categories={categories} resolveBranchId={resolveBranchId} />
      </div>
    </div>
  );
}
