import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROLE_LABELS } from '@libreta/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/)?.[0]?.toUpperCase() ?? '')
    .join('');
}

export function AppHeader() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
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
    <header className="app-topbar">
      <div className="app-topbar__brand" aria-label="FATBOY">
        FATBOY
      </div>
      <div className="app-topbar__divider" />
      <strong className="app-topbar__section">Libreta de hoy</strong>

      <div className="app-topbar__shift">
        <span /> Turno abierto
      </div>

      <div className="app-topbar__account" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="app-topbar__avatar">{initials(user?.displayName ?? 'Usuario')}</span>
          <span className="app-topbar__user-copy">
            <strong>{user?.displayName ?? 'Usuario'}</strong>
            <small>{user ? ROLE_LABELS[user.role] : ''}</small>
          </span>
          <ChevronDown size={17} />
        </button>

        {menuOpen ? (
          <div role="menu" className="app-account-menu">
            <button type="button" role="menuitem" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              {theme === 'dark' ? 'Usar modo claro' : 'Usar modo oscuro'}
            </button>
            <button type="button" role="menuitem" onClick={() => void handleLogout()}>
              <LogOut size={17} /> Cerrar sesión
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
