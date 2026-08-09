import { useMutation, useQuery } from '@tanstack/react-query';
import { apiFetch, apiFetchBlob } from '@/lib/api/client';
import type { MovementDirection, MovementStatus } from '@libreta/shared';

export interface ReportMovement {
  id: string;
  branchId: string;
  employeeId: string;
  categoryId: string;
  direction: MovementDirection;
  amountCents: number;
  concept: string;
  occurredAt: string;
  status: MovementStatus;
  branch: { id: string; name: string; code: string };
  employee: { id: string; displayName: string; employeeNumber: string };
  category: { id: string; label: string; colorToken: string; iconName: string };
  createdBy: { id: string; displayName: string } | null;
}

export interface ReportTotals {
  chargeCents: number;
  creditCents: number;
  netCents: number;
  byCategory: { label: string; amountCents: number }[];
}

export interface MovementsReportResult {
  items: ReportMovement[];
  totals: ReportTotals;
}

export interface ReportFilters {
  branchId?: string;
  employeeId?: string;
  categoryId?: string;
  status?: MovementStatus;
  from?: string;
  to?: string;
}

export interface BalanceReportRow {
  employeeId: string;
  displayName: string;
  employeeNumber: string;
  branch: { id: string; name: string } | null;
  balanceCents: number;
}

function buildQuery(filters: ReportFilters): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function useMovementsReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'movements', filters],
    queryFn: () => apiFetch<MovementsReportResult>(`/reports/movements${buildQuery(filters)}`),
  });
}

export function useBalancesReport(branchId?: string) {
  return useQuery({
    queryKey: ['reports', 'balances', branchId],
    queryFn: () =>
      apiFetch<BalanceReportRow[]>(`/reports/balances${branchId ? `?branchId=${branchId}` : ''}`),
  });
}

export function useExportMovementsCsv() {
  return useMutation({
    mutationFn: async (filters: ReportFilters) => {
      const blob = await apiFetchBlob(`/reports/movements/export.csv${buildQuery(filters)}`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'movimientos.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });
}
