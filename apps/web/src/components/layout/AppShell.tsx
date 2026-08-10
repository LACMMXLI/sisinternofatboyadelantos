import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';

/**
 * Envolvente general de las rutas autenticadas (§4.5). El máximo de 1600px y
 * los 16–24px de separación se aplican aquí para que todas las pantallas
 * compartan el mismo ritmo horizontal.
 */
export function AppShell() {
  return (
    <div className="app-shell">
      <AppHeader />
      <div className="app-shell__body">
        <BottomNav />
        <main className="app-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
