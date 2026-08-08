import { CheckCircle2, ChevronRight, History, Printer, type LucideIcon } from 'lucide-react';

const ACTIONS: { label: string; icon: LucideIcon }[] = [
  { label: 'Ver historial completo', icon: History },
  { label: 'Imprimir resumen', icon: Printer },
  { label: 'Enviar a nómina', icon: CheckCircle2 },
];

export function QuickActionsCard() {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-control">
      <h3 className="mb-3 text-sm font-bold text-ink">Acciones Rápidas</h3>
      <ul className="space-y-2">
        {ACTIONS.map(({ label, icon: Icon }) => (
          <li key={label}>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-control bg-brand-600/8 px-3.5 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-600/14"
            >
              <Icon size={16} />
              <span className="flex-1 text-left">{label}</span>
              <ChevronRight size={16} className="text-brand-600/60" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
