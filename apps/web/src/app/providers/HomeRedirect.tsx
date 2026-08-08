import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

/**
 * El autoservicio de empleado (§5) nunca debe caer en la libreta general
 * (esa vista enumera empleados, algo que EMPLOYEE_SELF_SERVICE no puede
 * hacer ni por API). Todo lo demás va a /app/libreta.
 */
export function HomeRedirect() {
  const { user, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-brand-600" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'EMPLOYEE_SELF_SERVICE') return <Navigate to="/mi-libreta" replace />;
  return <Navigate to="/app/libreta" replace />;
}
