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
    <div className="flex min-h-dvh flex-col bg-canvas">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-5 md:px-6 md:py-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
