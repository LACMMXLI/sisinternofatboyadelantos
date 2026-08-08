import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { ApiError } from '@/lib/api/client';

const loginSchema = z.object({
  usernameOrEmail: z.string().min(1, 'Escribe tu usuario o correo.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { user, login, isLoggingIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  if (user) {
    const redirectTo = user.mustChangePassword
      ? '/change-temporary-password'
      : user.role === 'EMPLOYEE_SELF_SERVICE'
        ? '/mi-libreta'
        : '/app/libreta';
    return <Navigate to={redirectTo} replace />;
  }

  const onSubmit = async (data: LoginForm) => {
    setFormError(null);
    try {
      const loggedInUser = await login(data.usernameOrEmail, data.password);
      const from = (location.state as { from?: string } | null)?.from;
      const defaultDestination =
        loggedInUser.role === 'EMPLOYEE_SELF_SERVICE' ? '/mi-libreta' : '/app/libreta';
      const destination = loggedInUser.mustChangePassword
        ? '/change-temporary-password'
        : (from ?? defaultDestination);
      navigate(destination, { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'No se pudo iniciar sesión. Intenta de nuevo.',
      );
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8 shadow-panel">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-600/10 text-brand-600">
            <LogIn size={26} />
          </div>
          <h1 className="text-xl font-bold text-ink">Libreta de Nóminas</h1>
          <p className="mt-1.5 text-sm text-muted">Inicia sesión para continuar.</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="usernameOrEmail" className="mb-1.5 block text-sm font-medium text-ink">
              Usuario o correo
            </label>
            <input
              id="usernameOrEmail"
              type="text"
              autoComplete="username"
              className="h-12 w-full rounded-control border border-line bg-surface-soft px-4 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              {...register('usernameOrEmail')}
            />
            {errors.usernameOrEmail ? (
              <p className="mt-1 text-xs text-danger">{errors.usernameOrEmail.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="h-12 w-full rounded-control border border-line bg-surface-soft px-4 pr-11 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-ink"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            ) : null}
          </div>

          {formError ? (
            <div
              role="alert"
              className="rounded-control bg-danger-soft px-3.5 py-2.5 text-sm text-danger"
            >
              {formError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoggingIn}
            className="h-12 w-full rounded-control bg-success text-sm font-semibold text-white shadow-control transition hover:brightness-105 disabled:opacity-60"
          >
            {isLoggingIn ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
