import { LogIn } from 'lucide-react';

/**
 * Placeholder visual de inicio de sesión. El formulario real (correo/usuario
 * + contraseña, PIN rápido, contraseña temporal) y su conexión a
 * POST /auth/login se implementan en la Fase 2.
 */
export function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8 text-center shadow-panel">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600/10 text-brand-600">
          <LogIn size={26} />
        </div>
        <h1 className="text-xl font-bold text-ink">Libreta de Nóminas</h1>
        <p className="mt-1.5 text-sm text-muted">
          El formulario de acceso real se conecta en la Fase 2.
        </p>
      </div>
    </div>
  );
}
