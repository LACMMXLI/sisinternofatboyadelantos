import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';

export interface EmployeeBranchRef {
  id: string;
  name: string;
  code: string;
}

export interface EmployeeView {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  displayName: string;
  jobTitle: string | null;
  photoObjectKey: string | null;
  hireDate: string | null;
  active: boolean;
  primaryBranchId: string;
  createdAt: string;
  primaryBranch: EmployeeBranchRef;
  additionalBranches: { branch: EmployeeBranchRef }[];
}

export interface ListEmployeesParams {
  search?: string;
  branchId?: string;
  active?: boolean;
}

export interface EmployeeInput {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  jobTitle?: string;
  hireDate?: string;
  primaryBranchId: string;
  additionalBranchIds?: string[];
}

function buildQuery(params: Record<string, string | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function useEmployees(params: ListEmployeesParams = {}) {
  return useQuery({
    queryKey: ['employees', params],
    queryFn: () =>
      apiFetch<EmployeeView[]>(
        `/employees${buildQuery({
          search: params.search,
          branchId: params.branchId,
          active: params.active,
        })}`,
      ),
  });
}

export function useEmployee(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['employees', employeeId],
    queryFn: () => apiFetch<EmployeeView>(`/employees/${employeeId}`),
    enabled: Boolean(employeeId),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EmployeeInput) =>
      apiFetch<EmployeeView>('/employees', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<EmployeeInput> & { id: string; active?: boolean }) =>
      apiFetch<EmployeeView>(`/employees/${id}`, { method: 'PATCH', body }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employees', variables.id] });
    },
  });
}

export function useSetEmployeeActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch<EmployeeView>(`/employees/${id}/${active ? 'reactivate' : 'deactivate'}`, {
        method: 'POST',
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employees', variables.id] });
    },
  });
}
