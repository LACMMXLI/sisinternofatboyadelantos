import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/**
 * PermissionGate de presentación (§4.7): evita renderizar rutas que el
 * usuario no podría usar. La protección real vive en cada endpoint de la
 * API — esto es solo experiencia de usuario.
 */
export function RequireAuth({ children }: PropsWithChildren) {
  const { user, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-brand-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user.mustChangePassword && location.pathname !== '/change-temporary-password') {
    return <Navigate to="/change-temporary-password" replace />;
  }

  return children;
}
