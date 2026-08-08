import { BarChart3, NotebookText, Settings, Users, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { roleHasCapability, type Capability } from '@libreta/shared';
import { cn } from '@/lib/utils/cn';
import { useAuth } from '@/app/providers/AuthProvider';

interface NavItem {
  to: string;
  label: string;
  icon: typeof NotebookText;
  capability: Capability;
  activeBg: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app/libreta', label: 'Libreta', icon: NotebookText, capability: 'movement.create', activeBg: 'bg-brand-600' },
  { to: '/app/nomina', label: 'Nómina', icon: Wallet, capability: 'payroll.prepare', activeBg: 'bg-success' },
  { to: '/app/reportes', label: 'Reportes', icon: BarChart3, capability: 'report.read', activeBg: 'bg-purple' },
  { to: '/app/empleados', label: 'Empleados', icon: Users, capability: 'employee.read', activeBg: 'bg-pink' },
  {
    to: '/app/configuracion/negocio',
    label: 'Configuración',
    icon: Settings,
    capability: 'organization.manage',
    activeBg: 'bg-warning',
  },
];

/**
 * Navegación principal (§4.5). Barra inferior fija con iconos grandes,
 * sombra elevada y una píldora de color propia por destino cuando está
 * activo, para que no se pierda contra el fondo claro de la app. Cada
 * destino se filtra por la capacidad del rol — presentación solamente: la
 * protección real vive en cada endpoint (§5).
 */
export function BottomNav() {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => user && roleHasCapability(user.role, item.capability));

  return (
    <nav
      className="sticky bottom-0 z-30 w-full border-t border-line bg-surface shadow-[0_-6px_20px_rgba(16,32,63,0.1)]"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-[1600px] items-stretch justify-around px-2 py-1.5">
        {items.map(({ to, label, icon: Icon, activeBg }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-w-[60px] flex-col items-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-semibold transition-colors',
                isActive ? 'text-ink' : 'text-ink/55 hover:text-ink/80',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'grid h-8 w-8 place-items-center rounded-xl transition-colors',
                    isActive ? cn(activeBg, 'text-white shadow-control') : 'text-current',
                  )}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
