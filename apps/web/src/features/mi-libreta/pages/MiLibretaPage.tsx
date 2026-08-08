import { BookUser } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function MiLibretaPage() {
  return (
    <PagePlaceholder
      icon={BookUser}
      title="Mi libreta"
      description="Vista privada del empleado: saldo, movimientos, periodo, estado y resumen descargable."
      phase="Fase 6"
    />
  );
}
