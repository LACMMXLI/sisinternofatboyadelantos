import { NotebookPen } from 'lucide-react';
import { MovementCaptureForm } from './MovementCaptureForm';
import type { MovementCategoryView } from '@/features/configuracion/api';
import type { EmployeeComboboxOption } from '@/components/employees/EmployeeCombobox';

interface QuickCaptureBarProps {
  employees: EmployeeComboboxOption[];
  categories: MovementCategoryView[];
  resolveBranchId: (employeeId: string) => string | undefined;
}

/**
 * Franja de captura rápida integrada en la hoja (§3, escritorio/tablet):
 * siempre visible, sin abrir un modal aparte — "escribir el siguiente
 * renglón de la libreta".
 */
export function QuickCaptureBar({ employees, categories, resolveBranchId }: QuickCaptureBarProps) {
  return (
    <section className="rounded-card border border-line bg-surface-soft p-4 shadow-control">
      <div className="mb-3 flex items-center gap-2">
        <NotebookPen size={17} className="text-brand-600" />
        <h2 className="text-sm font-bold text-ink">Anotar movimiento</h2>
      </div>
      <MovementCaptureForm employees={employees} categories={categories} resolveBranchId={resolveBranchId} />
    </section>
  );
}
