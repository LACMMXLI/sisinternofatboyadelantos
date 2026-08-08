import { Bell, Menu, Search } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';

interface AppHeaderProps {
  onOpenMenu?: () => void;
  searchPlaceholder?: string;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}

/**
 * AppHeader — encabezado de marca (§4.5). Degradado azul elegante, búsqueda
 * contextual, campana de notificaciones y menú de sesión. La búsqueda y las
 * notificaciones reales se conectan en fases posteriores; aquí queda el
 * contenedor visual y accesible.
 */
export function AppHeader({ onOpenMenu, searchPlaceholder = 'Buscar empleado…' }: AppHeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 h-[72px] w-full bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 text-white shadow-panel md:h-20">
      <div className="mx-auto flex h-full max-w-[1600px] items-center gap-3 px-4 md:gap-6 md:px-6">
        {onOpenMenu ? (
          <button
            type="button"
            onClick={onOpenMenu}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-control text-white/90 hover:bg-white/10 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
        ) : null}

        <div className="flex shrink-0 items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 text-lg font-bold">
            📒
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="font-sans text-[15px] font-bold">Libreta de Nóminas</p>
            <p className="text-xs text-white/75">{user?.organizationName ?? 'Fatboy'}</p>
          </div>
        </div>

        <label className="relative ml-auto hidden max-w-md flex-1 md:block">
          <Search
            size={18}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-white/70"
          />
          <input
            type="search"
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-pill border border-white/20 bg-white/10 pl-10 pr-4 text-sm text-white placeholder:text-white/70 outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          />
        </label>

        <button
          type="button"
          className="relative ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-control hover:bg-white/10 md:ml-0"
          aria-label="Notificaciones"
        >
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-danger" />
        </button>

        <div className="flex shrink-0 items-center gap-2.5 pl-1">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-sm font-bold">
            {initialsFrom(user?.displayName ?? 'Invitado')}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold">{user?.displayName ?? 'Invitado'}</p>
            <p className="text-xs text-white/75">{user ? user.role : 'Sin sesión'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
