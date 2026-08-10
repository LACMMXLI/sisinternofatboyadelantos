/**
 * "Resorte" central de la libreta (pantalla principal, corrección
 * 2026-08-09 #2): columna angosta con argollas que simula el doblez físico
 * entre la hoja izquierda (lista de empleados) y la hoja derecha (detalle
 * del empleado seleccionado). Solo visible en pantallas anchas (xl+),
 * donde ambas hojas conviven lado a lado; en móvil/tablet se apilan y el
 * resorte no aplica.
 */
export function NotebookSpine({ count = 18 }: { count?: number }) {
  return (
    <div
      className="relative hidden w-7 shrink-0 xl:flex xl:flex-col xl:items-center"
      aria-hidden="true"
    >
      {/* Doblez central: línea sutil que corre por detrás de las argollas */}
      <div className="absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-line" />
      <div className="relative flex h-full flex-col justify-evenly py-8">
        {Array.from({ length: count }).map((_, i) => (
          <span
            key={i}
            className="h-4 w-4 rounded-full border-[3px] border-line bg-canvas shadow-[inset_0_1px_2px_rgba(16,32,63,0.12)]"
          />
        ))}
      </div>
    </div>
  );
}
