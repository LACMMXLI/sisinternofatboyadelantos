import { Pencil } from 'lucide-react';
import { avatarColorFor, initialsFrom } from '@/lib/utils/avatar';
import { cn } from '@/lib/utils/cn';

interface EmployeeIdentityCardProps {
  displayName: string;
  jobTitle: string;
  employeeNumber?: string;
  photoUrl?: string;
  active?: boolean;
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * Identidad del empleado seleccionado + pestañas de la libreta (referencia
 * visual 1). Solo "Movimientos" está activa en el prototipo; el resto
 * llega con contenido real en fases posteriores.
 */
export function EmployeeIdentityCard({
  displayName,
  jobTitle,
  employeeNumber,
  photoUrl,
  active = true,
  tabs,
  activeTab,
  onTabChange,
}: EmployeeIdentityCardProps) {
  const avatarColor = avatarColorFor(displayName);

  return (
    <div className="mb-4 flex items-center gap-4 px-1">
      <div className="relative shrink-0">
        {photoUrl ? (
          <img src={photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div
            className={cn(
              'grid h-14 w-14 place-items-center rounded-full text-lg font-bold',
              avatarColor.bg,
              avatarColor.text,
            )}
          >
            {initialsFrom(displayName)}
          </div>
        )}
        {active ? (
          <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-canvas bg-success" />
        ) : null}
      </div>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold text-ink">{displayName}</h1>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">{jobTitle}</span>
          {employeeNumber ? (
            <span className="rounded-pill bg-brand-600/10 px-2 py-0.5 text-xs font-semibold text-brand-700">
              ID: {employeeNumber}
            </span>
          ) : null}
        </div>

        <nav className="mt-3 flex gap-4 border-b border-line">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={cn(
                '-mb-px border-b-2 pb-2 text-sm font-semibold transition-colors',
                tab === activeTab
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      <button
        type="button"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-control border border-line text-muted hover:bg-surface-soft hover:text-ink"
        aria-label="Editar empleado"
      >
        <Pencil size={15} />
      </button>
    </div>
  );
}
