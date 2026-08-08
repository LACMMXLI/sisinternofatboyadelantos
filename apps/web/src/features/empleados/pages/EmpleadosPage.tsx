import { Users } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function EmpleadosPage() {
  return (
    <PagePlaceholder
      icon={Users}
      title="Empleados"
      description="Alta, edición, baja lógica, foto/iniciales y asignación de sucursales."
      phase="Fase 3"
    />
  );
}
