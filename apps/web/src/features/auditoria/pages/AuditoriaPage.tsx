import { ScrollText } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function AuditoriaPage() {
  return (
    <PagePlaceholder
      icon={ScrollText}
      title="Auditoría"
      description="Búsqueda y filtros de solo lectura sobre el registro de auditoría."
      phase="Fase 2 / Fase 4"
    />
  );
}
