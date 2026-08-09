import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/client';
import type { MovementDirection, Role } from '@libreta/shared';

// ---------------------------------------------------------------------------
// Negocio
// ---------------------------------------------------------------------------

export interface OrganizationView {
  id: string;
  name: string;
  slug: string;
  currency: string;
  timezone: string;
  primaryColor: string;
  active: boolean;
}

export function useOrganization() {
  return useQuery({
    queryKey: ['organization', 'current'],
    queryFn: () => apiFetch<OrganizationView>('/organizations/current'),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Pick<OrganizationView, 'name' | 'primaryColor' | 'timezone' | 'currency'>>) =>
      apiFetch<OrganizationView>('/organizations/current', { method: 'PATCH', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['organization', 'current'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Sucursales
// ---------------------------------------------------------------------------

export interface BranchView {
  id: string;
  code: string;
  name: string;
  address: string | null;
  active: boolean;
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () => apiFetch<BranchView[]>('/branches'),
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { code: string; name: string; address?: string }) =>
      apiFetch<BranchView>('/branches', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

export function useSetBranchActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch<BranchView>(`/branches/${id}/${active ? 'reactivate' : 'deactivate'}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

export interface UserView {
  id: string;
  username: string;
  email: string | null;
  displayName: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  branchAccess: { branch: { id: string; name: string; code: string } }[];
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiFetch<UserView[]>('/users'),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      username: string;
      displayName: string;
      email?: string;
      role: Role;
      branchIds?: string[];
    }) => apiFetch<{ user: UserView; tempPassword: string }>('/users', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useSetUserActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch<UserView>(`/users/${id}/${active ? 'reactivate' : 'deactivate'}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ tempPassword: string }>(`/users/${id}/reset-password`, { method: 'POST' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useLogoutAllUserSessions() {
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/users/${id}/logout-all`, { method: 'POST' }),
  });
}

// ---------------------------------------------------------------------------
// Categorías de movimiento
// ---------------------------------------------------------------------------

export interface MovementCategoryView {
  id: string;
  code: string;
  label: string;
  direction: MovementDirection;
  iconName: string;
  colorToken: string;
  sortOrder: number;
  requiresNote: boolean;
  requiresEvidence: boolean;
  requiresApproval: boolean;
  approvalThresholdCents: number | null;
  dailyLimitCents: number | null;
  weeklyLimitCents: number | null;
  maxPerMovementCents: number | null;
  system: boolean;
  active: boolean;
}

export interface CreateMovementCategoryInput {
  code: string;
  label: string;
  direction: MovementDirection;
  iconName: string;
  colorToken: string;
  sortOrder?: number;
  requiresNote?: boolean;
  requiresEvidence?: boolean;
  requiresApproval?: boolean;
  approvalThresholdCents?: number;
  dailyLimitCents?: number;
  weeklyLimitCents?: number;
  maxPerMovementCents?: number;
}

export function useMovementCategories(includeInactive = false) {
  return useQuery({
    queryKey: ['movement-categories', { includeInactive }],
    queryFn: () =>
      apiFetch<MovementCategoryView[]>(
        `/movement-categories${includeInactive ? '?includeInactive=true' : ''}`,
      ),
  });
}

export function useCreateMovementCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMovementCategoryInput) =>
      apiFetch<MovementCategoryView>('/movement-categories', { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['movement-categories'] });
    },
  });
}

export function useSetMovementCategoryActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiFetch<MovementCategoryView>(
        `/movement-categories/${id}/${active ? 'reactivate' : 'deactivate'}`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['movement-categories'] });
    },
  });
}
