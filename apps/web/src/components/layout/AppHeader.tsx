import { useEffect, useRef, useState } from 'react';
import { Bell, LogOut, Menu, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '@libreta/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { initialsFrom } from '@/lib/utils/avatar';

interface AppHeaderProps {
  onOpenMenu?: () => void;
  searchPlaceholder?: string;
}

/**
 * AppHeader — encabezado de marca (§4.5). Degradado azul elegante, búsqueda
 * contextual, campana de notificaciones y menú de sesión. La búsqueda real
 * se conecta en la Fase 3 junto con EmployeeSearch.
 */
export function AppHeader({ onOpenMenu, searchPlaceholder = 'Buscar empleado…' }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

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
            <p className="text-xs text-white/75">{user?.organizationName ?? ''}</p>
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

        <div className="relative shrink-0 pl-1" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-control py-1 pr-1 hover:bg-white/10"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-sm font-bold">
              {initialsFrom(user?.displayName ?? '?')}
            </div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-sm font-semibold">{user?.displayName ?? ''}</p>
              <p className="text-xs text-white/75">{user ? ROLE_LABELS[user.role] : ''}</p>
            </div>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute top-full right-0 mt-2 w-56 rounded-card border border-line bg-surface p-1.5 text-ink shadow-panel"
            >
              <div className="px-3 py-2 sm:hidden">
                <p className="text-sm font-semibold">{user?.displayName}</p>
                <p className="text-xs text-muted">{user ? ROLE_LABELS[user.role] : ''}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft"
              >
                <LogOut size={17} />
                Cerrar sesión
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
