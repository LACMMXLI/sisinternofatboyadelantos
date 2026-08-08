import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { useOrganization, useUpdateOrganization } from '../api';
import { ApiError } from '@/lib/api/client';

export function NegocioPage() {
  const { data: organization, isLoading } = useOrganization();
  const updateOrganization = useUpdateOrganization();

  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0F67E8');
  const [timezone, setTimezone] = useState('America/Tijuana');
  const [currency, setCurrency] = useState('MXN');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!organization) return;
    setName(organization.name);
    setPrimaryColor(organization.primaryColor);
    setTimezone(organization.timezone);
    setCurrency(organization.currency);
  }, [organization]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await updateOrganization.mutateAsync({ name, primaryColor, timezone, currency });
      setMessage({ type: 'success', text: 'Negocio actualizado.' });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof ApiError ? error.message : 'No se pudo guardar.',
      });
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted">Cargando…</div>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600/10 text-brand-600">
          <Building2 size={22} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-ink">Configuración del negocio</h1>
          <p className="text-sm text-muted">Nombre, color de marca, moneda y zona horaria.</p>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4 rounded-card border border-line bg-surface p-6 shadow-control">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
            Nombre del negocio
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="primaryColor" className="mb-1.5 block text-sm font-medium text-ink">
              Color principal
            </label>
            <div className="flex items-center gap-2">
              <input
                id="primaryColor"
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-11 w-12 shrink-0 cursor-pointer rounded-control border border-line bg-surface-soft"
              />
              <input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
              />
            </div>
          </div>
          <div>
            <label htmlFor="currency" className="mb-1.5 block text-sm font-medium text-ink">
              Moneda
            </label>
            <input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
            />
          </div>
        </div>

        <div>
          <label htmlFor="timezone" className="mb-1.5 block text-sm font-medium text-ink">
            Zona horaria
          </label>
          <input
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="h-11 w-full rounded-control border border-line bg-surface-soft px-3.5 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-2 focus-visible:ring-brand-500/30"
          />
        </div>

        {message ? (
          <div
            role="status"
            className={
              message.type === 'success'
                ? 'rounded-control bg-success-soft px-3.5 py-2.5 text-sm text-success'
                : 'rounded-control bg-danger-soft px-3.5 py-2.5 text-sm text-danger'
            }
          >
            {message.text}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={updateOrganization.isPending}
          className="h-11 rounded-control bg-brand-600 px-5 text-sm font-semibold text-white shadow-control hover:brightness-105 disabled:opacity-60"
        >
          {updateOrganization.isPending ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
