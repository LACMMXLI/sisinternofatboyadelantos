import { Store } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function SucursalesPage() {
  return (
    <PagePlaceholder
      icon={Store}
      title="Sucursales"
      description="Nombre, código, dirección y estado de cada sucursal."
      phase="Fase 2"
    />
  );
}
