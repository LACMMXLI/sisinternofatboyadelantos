import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { apiFetch, ApiError, registerAuthHandlers } from '@/lib/api/client';
import type { LoginResponse, SessionUser } from '@/features/auth/types';

interface AuthContextValue {
  user: SessionUser | null;
  /** true mientras se intenta restaurar la sesión al cargar la app. */
  isBootstrapping: boolean;
  isLoggingIn: boolean;
  loginError: string | null;
  login: (usernameOrEmail: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  /** El backend es la fuente de verdad: tras cambiar contraseña, refleja el flag localmente. */
  markPasswordChanged: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Sesión real (§9, §13): el access token vive SOLO en memoria (una ref de
 * módulo, nunca en localStorage/sessionStorage) y el refresh token vive en
 * la cookie HttpOnly que pone el backend. Al montar la app, se intenta un
 * refresh silencioso para restaurar la sesión tras recargar la página.
 */
export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  // El refresh token rota en cada uso (un solo uso válido): si dos llamadas
  // concurrentes (StrictMode, dos pestañas de red, dos 401 a la vez) piden
  // refresh al mismo tiempo, la segunda con el token viejo fallaría. Se
  // deduplica a una sola promesa en vuelo.
  const refreshInFlightRef = useRef<Promise<string | null> | null>(null);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (refreshInFlightRef.current) {
      return refreshInFlightRef.current;
    }
    const promise = (async () => {
      try {
        const res = await apiFetch<LoginResponse>('/auth/refresh', {
          method: 'POST',
          skipAuthRetry: true,
        });
        accessTokenRef.current = res.accessToken;
        setUser(res.user);
        return res.accessToken;
      } catch {
        accessTokenRef.current = null;
        setUser(null);
        return null;
      } finally {
        refreshInFlightRef.current = null;
      }
    })();
    refreshInFlightRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    registerAuthHandlers({
      getAccessToken: () => accessTokenRef.current,
      refreshAccessToken,
      onSessionExpired: () => {
        accessTokenRef.current = null;
        setUser(null);
      },
    });
  }, [refreshAccessToken]);

  useEffect(() => {
    void refreshAccessToken().finally(() => setIsBootstrapping(false));
  }, [refreshAccessToken]);

  const login = useCallback(async (usernameOrEmail: string, password: string) => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: { usernameOrEmail, password },
        skipAuthRetry: true,
      });
      accessTokenRef.current = res.accessToken;
      setUser(res.user);
      return res.user;
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'No se pudo iniciar sesión. Intenta de nuevo.';
      setLoginError(message);
      throw error;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST', skipAuthRetry: true });
    } finally {
      accessTokenRef.current = null;
      setUser(null);
    }
  }, []);

  const markPasswordChanged = useCallback(() => {
    setUser((current) => (current ? { ...current, mustChangePassword: false } : current));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      isLoggingIn,
      loginError,
      login,
      logout,
      markPasswordChanged,
    }),
    [user, isBootstrapping, isLoggingIn, loginError, login, logout, markPasswordChanged],
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
