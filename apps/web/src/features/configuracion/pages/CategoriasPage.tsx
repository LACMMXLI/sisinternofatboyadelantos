import { Tags } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function CategoriasPage() {
  return (
    <PagePlaceholder
      icon={Tags}
      title="Categorías de movimiento"
      description="Etiqueta, icono, color, dirección, orden, límites y reglas de nota/evidencia."
      phase="Fase 3"
    />
  );
}
