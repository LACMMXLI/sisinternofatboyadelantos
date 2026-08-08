import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import type { Role } from '@libreta/shared';

/**
 * Estado de sesión mínimo para armar el layout y proteger rutas en el
 * frontend. La lógica real (login, refresh, /auth/me) se implementa en la
 * Fase 2 junto con AuthModule del backend. Ocultar rutas aquí es solo
 * presentación: la protección real vive en cada endpoint de la API.
 */
export interface SessionUser {
  id: string;
  displayName: string;
  role: Role;
  organizationName: string;
}

interface AuthContextValue {
  user: SessionUser | null;
  isLoading: boolean;
  /** Solo para desarrollo local mientras no existe login real (Fase 2). */
  setDevUser: (user: SessionUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading] = useState(false);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, setDevUser: setUser }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}
