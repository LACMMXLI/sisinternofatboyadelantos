import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { MovementDirection, MovementStatus } from '@libreta/shared';

export interface MovementCategoryRef {
  id: string;
  code: string;
  label: string;
  iconName: string;
  colorToken: string;
  direction: MovementDirection;
}

export interface MovementView {
  id: string;
  employeeId: string;
  branchId: string;
  categoryId: string;
  direction: MovementDirection;
  amountCents: number;
  concept: string;
  occurredAt: string;
  status: MovementStatus;
  idempotencyKey: string;
  originalMovementId: string | null;
  reversalReason: string | null;
  metadata: { note?: string } | null;
  createdAt: string;
  category: MovementCategoryRef;
  createdBy: { id: string; displayName: string } | null;
  approvedBy: { id: string; displayName: string } | null;
  employee: { id: string; displayName: string; employeeNumber: string } | null;
  branch: { id: string; name: string } | null;
}

export interface LedgerBreakdownItem {
  categoryId: string;
  label: string;
  colorToken: string;
  iconName: string;
  amountCents: number;
}

export interface LedgerSummary {
  balanceCents: number;
  pendingApprovalCents: number;
  breakdown: LedgerBreakdownItem[];
}

export function useLedgerSummary(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['ledger-summary', employeeId],
    queryFn: () => apiFetch<LedgerSummary>(`/employees/${employeeId}/ledger/summary`),
    enabled: Boolean(employeeId),
  });
}

export function useMovements(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['movements', employeeId],
    queryFn: () => apiFetch<MovementView[]>(`/movements?employeeId=${employeeId}`),
    enabled: Boolean(employeeId),
  });
}

export interface DailyMovementsParams {
  fromIso: string;
  toIso: string;
  branchId?: string;
}

/**
 * Movimientos de la jornada (§ pantalla "Libreta del día"): reutiliza
 * `GET /movements` con `from`/`to` en vez de filtrar por un solo empleado,
 * para poder mostrar en una sola hoja los movimientos de todos los
 * empleados del día seleccionado. Los límites de fecha se calculan en
 * `America/Tijuana` (ver `lib/utils/date.ts`), nunca con `toDateString()`.
 */
export function useDailyMovements({ fromIso, toIso, branchId }: DailyMovementsParams) {
  return useQuery({
    queryKey: ['movements', 'daily', fromIso, toIso, branchId ?? 'all'],
    queryFn: () => {
      const params = new URLSearchParams({ from: fromIso, to: toIso });
      if (branchId) params.set('branchId', branchId);
      return apiFetch<MovementView[]>(`/movements?${params.toString()}`);
    },
  });
}

export interface CreateMovementInput {
  employeeId: string;
  branchId: string;
  categoryId: string;
  amountCents: number;
  concept: string;
  note?: string;
  idempotencyKey: string;
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMovementInput) =>
      apiFetch<MovementView>('/movements', { method: 'POST', body }),
    onSuccess: () => {
      // Invalida toda la familia 'movements' (incluye la hoja diaria
      // ['movements','daily',...] y el historial de un empleado
      // ['movements', employeeId]) para que la anotación aparezca sin
      // recargar manualmente, sin importar desde qué vista se registró.
      void queryClient.invalidateQueries({ queryKey: ['movements'] });
      void queryClient.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

function useMovementMutation(action: 'approve' | 'reject' | 'reverse') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiFetch<MovementView>(`/movements/${id}/${action}`, {
        method: 'POST',
        body: action === 'reject' ? { reason } : action === 'reverse' ? { reason } : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['movements'] });
      void queryClient.invalidateQueries({ queryKey: ['ledger-summary'] });
    },
  });
}

export const useApproveMovement = () => useMovementMutation('approve');
export const useRejectMovement = () => useMovementMutation('reject');
export const useReverseMovement = () => useMovementMutation('reverse');
