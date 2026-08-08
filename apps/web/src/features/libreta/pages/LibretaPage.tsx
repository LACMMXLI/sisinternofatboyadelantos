import { useState } from 'react';
import { MessageSquareText, Plus } from 'lucide-react';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeeIdentityCard } from '@/components/employees/EmployeeIdentityCard';
import { NotebookShell } from '@/components/notebook/NotebookShell';
import { BalanceCard } from '@/components/balance/BalanceCard';
import { QuickMovementGrid } from '@/components/movement/QuickMovementGrid';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { WeeklySummaryCard } from '@/components/dashboard/WeeklySummaryCard';
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';
import {
  MOCK_BREAKDOWN,
  MOCK_EMPLOYEES,
  MOCK_MOVEMENTS,
  MOCK_RECENT_ACTIVITY,
  MOCK_WEEK_TOTAL_CENTS,
} from '@/features/libreta/mockData';

const TABS = ['Movimientos', 'Resumen', 'Historial Semanal', 'Notas'];

/**
 * Pantalla insignia (§4.5). Prototipo visual adelantado de la Fase 4 con
 * datos de ejemplo (`mockData.ts`) para validar el parecido con las
 * referencias antes de conectar Empleados/Ledger reales — ver
 * IMPLEMENTATION_PLAN.md. Los botones de acción quedan sin efecto todavía;
 * se conectan cuando exista LedgerModule.
 */
export function LibretaPage() {
  const [selectedId, setSelectedId] = useState(MOCK_EMPLOYEES[0].id);
  const [activeTab, setActiveTab] = useState('Movimientos');
  const employee = MOCK_EMPLOYEES.find((e) => e.id === selectedId) ?? MOCK_EMPLOYEES[0];
  const firstName = employee.displayName.split(' ')[0];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[300px_minmax(560px,1fr)_320px]">
        <EmployeeList
          employees={MOCK_EMPLOYEES}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onNewMovement={() => {}}
        />

        <div className="rounded-card border border-line bg-surface p-6 shadow-control xl:min-h-[70vh]">
          <EmployeeIdentityCard
            displayName={employee.displayName}
            jobTitle={employee.jobTitle}
            employeeNumber={employee.id.padStart(4, '0')}
            active={employee.active}
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
          <NotebookShell
            employeeFirstName={firstName}
            periodLabel="Semana Actual"
            movements={MOCK_MOVEMENTS}
            totalCents={MOCK_WEEK_TOTAL_CENTS}
          />
        </div>

        <div className="space-y-4">
          <BalanceCard balanceCents={employee.balanceCents} breakdown={MOCK_BREAKDOWN} />

          <button
            type="button"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-control bg-success text-sm font-semibold text-white shadow-control transition hover:brightness-105"
          >
            <Plus size={18} /> Nuevo Movimiento
          </button>

          <QuickMovementGrid />

          <button
            type="button"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-control bg-brand-600/8 text-sm font-semibold text-brand-700 hover:bg-brand-600/14"
          >
            <MessageSquareText size={16} /> Nota / Comentario
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <RecentActivityCard items={MOCK_RECENT_ACTIVITY} />
        <WeeklySummaryCard totalCents={MOCK_WEEK_TOTAL_CENTS} breakdown={MOCK_BREAKDOWN} />
        <QuickActionsCard />
      </div>
    </div>
  );
}
