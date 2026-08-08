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
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app/libreta', label: 'Libreta', icon: NotebookText, capability: 'movement.create' },
  { to: '/app/nomina', label: 'Nómina', icon: Wallet, capability: 'payroll.prepare' },
  { to: '/app/reportes', label: 'Reportes', icon: BarChart3, capability: 'report.read' },
  { to: '/app/empleados', label: 'Empleados', icon: Users, capability: 'employee.read' },
  {
    to: '/app/configuracion/negocio',
    label: 'Configuración',
    icon: Settings,
    capability: 'organization.manage',
  },
];

/**
 * Navegación principal (§4.5). Barra inferior fija con iconos grandes y
 * etiquetas claras. Cada destino se filtra por la capacidad del rol —
 * presentación solamente: la protección real vive en cada endpoint (§5).
 */
export function BottomNav() {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => user && roleHasCapability(user.role, item.capability));

  return (
    <nav
      className="sticky bottom-0 z-30 w-full border-t border-line bg-surface/95 backdrop-blur"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-[1600px] items-stretch justify-around px-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex min-w-[64px] flex-col items-center gap-1 px-2 py-2.5 text-xs font-medium transition-colors',
                isActive ? 'text-brand-600' : 'text-muted hover:text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-2xl',
                    isActive && 'bg-brand-600/10',
                  )}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
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
