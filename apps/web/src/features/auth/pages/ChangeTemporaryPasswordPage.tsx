import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { apiFetch, ApiError } from '@/lib/api/client';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Escribe tu contraseña actual.'),
    newPassword: z.string().min(10, 'La nueva contraseña debe tener al menos 10 caracteres.'),
    confirmPassword: z.string().min(1, 'Confirma la nueva contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });
type FormValues = z.infer<typeof schema>;

export function ChangeTemporaryPasswordPage() {
  const { user, markPasswordChanged } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) return <Navigate to="/app/libreta" replace />;

  const onSubmit = async (data: FormValues) => {
    setFormError(null);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: { currentPassword: data.currentPassword, newPassword: data.newPassword },
      });
      markPasswordChanged();
      navigate('/app/libreta', { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'No se pudo cambiar la contraseña.',
      );
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-surface p-8 shadow-panel">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-warning-soft text-warning">
            <KeyRound size={26} />
          </div>
          <h1 className="text-xl font-bold text-ink">Cambia tu contraseña</h1>
          <p className="mt-1.5 text-sm text-muted">
            Tu cuenta tiene una contraseña temporal. Define una nueva para continuar.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-ink">
              Contraseña temporal actual
            </label>
            <input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              className="h-12 w-full rounded-control border border-line bg-surface-soft px-4 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              {...register('currentPassword')}
            />
            {errors.currentPassword ? (
              <p className="mt-1 text-xs text-danger">{errors.currentPassword.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-ink">
              Nueva contraseña
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              className="h-12 w-full rounded-control border border-line bg-surface-soft px-4 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              {...register('newPassword')}
            />
            {errors.newPassword ? (
              <p className="mt-1 text-xs text-danger">{errors.newPassword.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-ink">
              Confirma la nueva contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="h-12 w-full rounded-control border border-line bg-surface-soft px-4 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              {...register('confirmPassword')}
            />
            {errors.confirmPassword ? (
              <p className="mt-1 text-xs text-danger">{errors.confirmPassword.message}</p>
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
            disabled={isSubmitting}
            className="h-12 w-full rounded-control bg-success text-sm font-semibold text-white shadow-control transition hover:brightness-105 disabled:opacity-60"
          >
            {isSubmitting ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
