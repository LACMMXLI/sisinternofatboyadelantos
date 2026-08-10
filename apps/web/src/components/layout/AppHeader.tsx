import { useEffect, useRef, useState } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '@libreta/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';

interface AppHeaderProps {
  branchName?: string;
  managerName?: string;
}

/**
 * AppHeader — encabezado estilo "Libreta Digital" (Sistema Stitch).
 * TopAppBar con:
 * - Background oscuro (#0b1326)
 * - Logo "Libreta Digital" en Primary Red (#e11d48)
 * - Border inferior 4px Primary Red
 * - Información de sucursal y encargado
 * - Altura 88px (56px + 32px padding)
 */
export function AppHeader({ branchName = 'Sucursal Venecia', managerName = 'Encargado' }: AppHeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
    <header className="sticky top-0 z-30 w-full bg-surface border-b-4 border-brand-500 shadow-sm fixed flex justify-between items-center px-8 h-[88px]">
      {/* Left side: Logo + Branch Info */}
      <div className="flex items-center gap-6 relative">
        <h1 className="text-headline-lg font-extrabold tracking-tight text-brand-600">Libreta Digital</h1>
        <div className="hidden md:flex flex-col border-l-2 border-muted pl-6 justify-center">
          <span className="text-label-bold text-muted uppercase tracking-wider">{branchName}</span>
          <span className="text-body-md text-ink font-medium">{managerName}: {user?.displayName ?? 'Usuario'}</span>
        </div>
      </div>

      {/* Right side: Action buttons */}
      <div className="flex items-center gap-4 relative">
        {/* Hide Guides button (optional) */}
        <button className="hidden md:flex bg-yellow-600 text-white px-4 py-2 rounded-full font-label-bold text-xs flex items-center gap-2 hover:opacity-90 transition-opacity mr-4 relative">
          <span className="text-[20px]">👁️</span>
          Ocultar Guías
        </button>

        {/* Location button */}
        <button aria-label="location_on" className="h-12 w-12 flex items-center justify-center rounded-full text-brand-600 hover:bg-surface-soft hover:scale-102 transition-transform duration-200">
          <span className="text-[28px]">📍</span>
        </button>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="h-12 w-12 flex items-center justify-center rounded-full text-brand-600 hover:bg-surface-soft hover:scale-102 transition-transform duration-200"
          aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
        </button>

        {/* Account menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="h-12 w-12 flex items-center justify-center rounded-full text-brand-600 hover:bg-surface-soft hover:scale-102 transition-transform duration-200 relative"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="text-[28px]">👤</span>
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-yellow-600 text-white p-4 shadow-lg border border-yellow-500 z-50"
            >
              <div className="mb-2">
                <p className="text-sm font-semibold">{user?.displayName}</p>
                <p className="text-xs text-yellow-100">{user ? ROLE_LABELS[user.role] : ''}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2.5 rounded px-3 py-2.5 text-sm font-medium text-white hover:bg-yellow-700"
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
