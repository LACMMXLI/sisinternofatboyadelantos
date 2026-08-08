import type { LucideIcon } from 'lucide-react';

interface PagePlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  phase: string;
}

/**
 * Marcador de posición temporal para rutas todavía no implementadas. Se
 * reemplaza módulo por módulo conforme avanzan las fases del
 * IMPLEMENTATION_PLAN.md — no es la pantalla final.
 */
export function PagePlaceholder({ icon: Icon, title, description, phase }: PagePlaceholderProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-card border border-dashed border-line bg-surface-soft p-10 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-600/10 text-brand-600">
        <Icon size={30} />
      </div>
      <div>
        <h1 className="text-xl font-bold text-ink">{title}</h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">{description}</p>
      </div>
      <span className="rounded-pill bg-warning-soft px-3 py-1 text-xs font-semibold text-warning">
        {phase}
      </span>
    </div>
  );
}
