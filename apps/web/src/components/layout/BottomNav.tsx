import { BarChart3, CalendarCheck2, Settings, Users, Wallet } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { roleHasCapability, type Capability } from '@libreta/shared';
import { useAuth } from '@/app/providers/AuthProvider';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarCheck2;
  capability: Capability;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/app/libreta', label: 'Libreta', icon: CalendarCheck2, capability: 'movement.create' },
  { to: '/app/nomina', label: 'Nómina', icon: Wallet, capability: 'payroll.prepare' },
  { to: '/app/empleados', label: 'Empleados', icon: Users, capability: 'employee.read' },
  { to: '/app/reportes', label: 'Reportes', icon: BarChart3, capability: 'report.read' },
  {
    to: '/app/configuracion/negocio',
    label: 'Configuración',
    icon: Settings,
    capability: 'organization.manage',
  },
];

export function BottomNav() {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => user && roleHasCapability(user.role, item.capability));

  const links = items.map(({ to, label, icon: Icon }) => (
    <NavLink
      key={to}
      to={to}
      aria-label={label}
      title={label}
      className={({ isActive }) => cn('app-nav-link', isActive && 'app-nav-link--active')}
    >
      <Icon size={22} strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  ));

  return (
    <>
      <aside className="app-side-nav" aria-label="Navegación principal">
        <nav>{links}</nav>
      </aside>
      <nav className="app-bottom-nav" aria-label="Navegación principal móvil">
        {links}
      </nav>
    </>
  );
}
