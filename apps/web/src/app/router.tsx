import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/app/providers/RequireAuth';
import { HomeRedirect } from '@/app/providers/HomeRedirect';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ChangeTemporaryPasswordPage } from '@/features/auth/pages/ChangeTemporaryPasswordPage';
import { LibretaPage } from '@/features/libreta/pages/LibretaPage';
import { EmpleadosPage } from '@/features/empleados/pages/EmpleadosPage';
import { EmpleadoDetallePage } from '@/features/empleados/pages/EmpleadoDetallePage';
import { NominaPage } from '@/features/nomina/pages/NominaPage';
import { NominaBatchPage } from '@/features/nomina/pages/NominaBatchPage';
import { ReportesPage } from '@/features/reportes/pages/ReportesPage';
import { NegocioPage } from '@/features/configuracion/pages/NegocioPage';
import { SucursalesPage } from '@/features/configuracion/pages/SucursalesPage';
import { UsuariosPage } from '@/features/configuracion/pages/UsuariosPage';
import { CategoriasPage } from '@/features/configuracion/pages/CategoriasPage';
import { AuditoriaPage } from '@/features/auditoria/pages/AuditoriaPage';
import { MiLibretaPage } from '@/features/mi-libreta/pages/MiLibretaPage';

/**
 * Mapa de rutas fijado por §9 del prompt maestro. RequireAuth protege por
 * presentación (redirige a /login sin sesión, o a cambio de contraseña si
 * es obligatorio); la protección real por rol/capacidad vive en la API.
 */
export const router = createBrowserRouter([
  { path: '/', element: <HomeRedirect /> },
  { path: '/login', element: <LoginPage /> },
  {
    path: '/change-temporary-password',
    element: (
      <RequireAuth>
        <ChangeTemporaryPasswordPage />
      </RequireAuth>
    ),
  },
  {
    path: '/mi-libreta',
    element: (
      <RequireAuth>
        <MiLibretaPage />
      </RequireAuth>
    ),
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="libreta" replace /> },
      { path: 'libreta', element: <LibretaPage /> },
      { path: 'empleados', element: <EmpleadosPage /> },
      { path: 'empleados/:employeeId', element: <EmpleadoDetallePage /> },
      { path: 'nomina', element: <NominaPage /> },
      { path: 'nomina/:batchId', element: <NominaBatchPage /> },
      { path: 'reportes', element: <ReportesPage /> },
      { path: 'configuracion/negocio', element: <NegocioPage /> },
      { path: 'configuracion/sucursales', element: <SucursalesPage /> },
      { path: 'configuracion/usuarios', element: <UsuariosPage /> },
      { path: 'configuracion/categorias', element: <CategoriasPage /> },
      { path: 'auditoria', element: <AuditoriaPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/app/libreta" replace /> },
]);
