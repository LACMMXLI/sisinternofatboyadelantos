import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { PayrollBatchStatus, PayrollPeriodFrequency } from '@libreta/shared';

export interface PayrollPeriodView {
  id: string;
  frequency: PayrollPeriodFrequency;
  startsAt: string;
  endsAt: string;
  payDate: string;
  status: 'OPEN' | 'CLOSED';
}

export interface PayrollBatchItemView {
  id: string;
  employeeId: string;
  balanceAtPrepCents: number;
  plannedAmountCents: number;
  appliedAmountCents: number;
  balanceAfterCents: number | null;
  ledgerMovementId: string | null;
  employee: { id: string; displayName: string; employeeNumber: string };
}

export interface PayrollBatchView {
  id: string;
  periodId: string;
  branchId: string | null;
  status: PayrollBatchStatus;
  version: number;
  lockedAt: string | null;
  appliedAt: string | null;
  closedAt: string | null;
  reopenedAt: string | null;
  reopenReason: string | null;
  totalPlannedCents: number;
  totalAppliedCents: number;
  createdAt: string;
  period: PayrollPeriodView;
  branch: { id: string; name: string; code: string } | null;
  items: PayrollBatchItemView[];
}

export function usePayrollPeriods() {
  return useQuery({
    queryKey: ['payroll-periods'],
    queryFn: () => apiFetch<PayrollPeriodView[]>('/payroll-periods'),
  });
}

export function useCreatePayrollPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      frequency: PayrollPeriodFrequency;
      startsAt: string;
      endsAt: string;
      payDate: string;
    }) => apiFetch<PayrollPeriodView>('/payroll-periods', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    },
  });
}

export function usePayrollBatches(params: { periodId?: string; status?: PayrollBatchStatus } = {}) {
  const search = new URLSearchParams();
  if (params.periodId) search.set('periodId', params.periodId);
  if (params.status) search.set('status', params.status);
  const qs = search.toString();
  return useQuery({
    queryKey: ['payroll-batches', params],
    queryFn: () => apiFetch<PayrollBatchView[]>(`/payroll-batches${qs ? `?${qs}` : ''}`),
  });
}

export function usePayrollBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: ['payroll-batches', batchId],
    queryFn: () => apiFetch<PayrollBatchView>(`/payroll-batches/${batchId}`),
    enabled: Boolean(batchId),
  });
}

export function usePrepareBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { periodId: string; branchId?: string }) =>
      apiFetch<PayrollBatchView>('/payroll-batches', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
    },
  });
}

function invalidateBatch(queryClient: ReturnType<typeof useQueryClient>, batchId: string) {
  void queryClient.invalidateQueries({ queryKey: ['payroll-batches'] });
  void queryClient.invalidateQueries({ queryKey: ['payroll-batches', batchId] });
}

export function useUpdateBatchItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      itemId,
      plannedAmountCents,
    }: {
      batchId: string;
      itemId: string;
      plannedAmountCents: number;
    }) =>
      apiFetch<PayrollBatchView>(`/payroll-batches/${batchId}/items/${itemId}`, {
        method: 'PATCH',
        body: { plannedAmountCents },
      }),
    onSuccess: (_data, variables) => invalidateBatch(queryClient, variables.batchId),
  });
}

function useBatchAction(action: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) =>
      apiFetch<PayrollBatchView>(`/payroll-batches/${batchId}/${action}`, { method: 'POST' }),
    onSuccess: (_data, batchId) => invalidateBatch(queryClient, batchId),
  });
}

export function useSubmitBatch() {
  return useBatchAction('submit');
}
export function useLockBatch() {
  return useBatchAction('lock');
}
export function useApplyBatch() {
  return useBatchAction('apply');
}
export function useCloseBatch() {
  return useBatchAction('close');
}

export function useReopenBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, reason }: { batchId: string; reason: string }) =>
      apiFetch<PayrollBatchView>(`/payroll-batches/${batchId}/reopen`, {
        method: 'POST',
        body: { reason },
      }),
    onSuccess: (_data, variables) => invalidateBatch(queryClient, variables.batchId),
  });
}
