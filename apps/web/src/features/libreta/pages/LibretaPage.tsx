import { NotebookText, Users, Wallet } from 'lucide-react';

/**
 * Esqueleto de la pantalla insignia (§4.5). La estructura de 3 columnas se
 * fija desde la Fase 1; el contenido real (EmployeeList, NotebookShell,
 * BalanceCard, QuickMovementGrid…) se construye en las Fases 3 y 4.
 */
export function LibretaPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[300px_minmax(560px,1fr)_320px]">
      <section className="rounded-card border border-line bg-surface p-4 shadow-control xl:min-h-[70vh]">
        <div className="mb-3 flex items-center gap-2 text-muted">
          <Users size={18} />
          <h2 className="text-sm font-semibold">Empleados</h2>
        </div>
        <p className="text-sm text-muted">
          Búsqueda y listado de empleados autorizados llegan en la Fase 3.
        </p>
      </section>

      <section className="rounded-card border border-line bg-surface p-6 shadow-control xl:min-h-[70vh]">
        <div className="mb-3 flex items-center gap-2 text-muted">
          <NotebookText size={18} />
          <h2 className="text-sm font-semibold">Libreta de movimientos</h2>
        </div>
        <p className="text-sm text-muted">
          La hoja tipo libreta con movimientos, saldo y accesos rápidos se construye en la
          Fase 4 sobre este mismo espacio central.
        </p>
      </section>

      <section className="rounded-card border border-line bg-surface p-4 shadow-control xl:min-h-[70vh]">
        <div className="mb-3 flex items-center gap-2 text-muted">
          <Wallet size={18} />
          <h2 className="text-sm font-semibold">Saldo y acciones</h2>
        </div>
        <p className="text-sm text-muted">
          BalanceCard, CategoryBreakdown y el botón "Nuevo movimiento" llegan en la Fase 4.
        </p>
      </section>
    </div>
  );
}
