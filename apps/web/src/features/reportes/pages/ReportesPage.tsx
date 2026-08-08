import { BarChart3 } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function ReportesPage() {
  return (
    <PagePlaceholder
      icon={BarChart3}
      title="Reportes"
      description="Saldos, movimientos, adelantos, consumos, pendientes y exportaciones."
      phase="Fase 8"
    />
  );
}
