import { KeyRound } from 'lucide-react';

export function ChangeTemporaryPasswordPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8 text-center shadow-panel">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-warning-soft text-warning">
          <KeyRound size={26} />
        </div>
        <h1 className="text-xl font-bold text-ink">Cambiar contraseña temporal</h1>
        <p className="mt-1.5 text-sm text-muted">
          Flujo de cambio obligatorio en primer acceso — se implementa en la Fase 2.
        </p>
      </div>
    </div>
  );
}
