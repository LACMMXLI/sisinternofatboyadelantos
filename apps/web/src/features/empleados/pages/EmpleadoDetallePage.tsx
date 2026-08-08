import { useParams } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function EmpleadoDetallePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  return (
    <PagePlaceholder
      icon={UserRound}
      title={`Expediente de empleado (${employeeId})`}
      description="Identidad, saldo, historial y resumen del empleado seleccionado."
      phase="Fase 3 / Fase 4"
    />
  );
}
