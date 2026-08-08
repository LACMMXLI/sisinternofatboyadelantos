/**
 * Argollas decorativas de la libreta (§4.1: "argollas decorativas con
 * pseudo-elementos o un pequeño componente repetible"). Puramente
 * ornamental — nunca reduce el espacio de lectura útil.
 */
export function NotebookRings({ count = 14 }: { count?: number }) {
  return (
    <div
      className="pointer-events-none absolute top-0 -left-3 hidden h-full flex-col justify-evenly py-6 sm:flex"
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-4 w-4 rounded-full border-[3px] border-line bg-canvas shadow-[inset_0_1px_2px_rgba(16,32,63,0.12)]"
        />
      ))}
    </div>
  );
}
