import { ShieldCheck } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function UsuariosPage() {
  return (
    <PagePlaceholder
      icon={ShieldCheck}
      title="Usuarios"
      description="Rol, sucursales permitidas, estado, contraseña temporal y cierre de sesiones."
      phase="Fase 2"
    />
  );
}
