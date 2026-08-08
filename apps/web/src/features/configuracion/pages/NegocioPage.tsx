import { Building2 } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function NegocioPage() {
  return (
    <PagePlaceholder
      icon={Building2}
      title="Configuración del negocio"
      description="Nombre, logotipo, color principal, moneda y zona horaria."
      phase="Fase 2"
    />
  );
}
