import { Wallet } from 'lucide-react';
import { PagePlaceholder } from '@/components/ui/PagePlaceholder';

export function NominaPage() {
  return (
    <PagePlaceholder
      icon={Wallet}
      title="Nómina"
      description="Periodos, lotes, liquidaciones parciales, exportación y cierre."
      phase="Fase 5"
    />
  );
}
