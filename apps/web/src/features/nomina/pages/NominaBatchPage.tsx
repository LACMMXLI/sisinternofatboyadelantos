import { useParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function NominaBatchPage() {
  const { batchId } = useParams<{ batchId: string }>();
  return (
    <PagePlaceholder
      icon={Receipt}
      title={`Lote de nómina (${batchId})`}
      description="Detalle del lote: empleados, montos planeados/aplicados y estado."
      phase="Fase 5"
    />
  );
}
