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
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['movements', variables.employeeId] });
      void queryClient.invalidateQueries({ queryKey: ['ledger-summary', variables.employeeId] });
    },
  });
}
