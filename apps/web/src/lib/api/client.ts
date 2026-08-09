/**
 * Cliente HTTP mínimo para la API. El access token vive en memoria
 * (nunca en localStorage) y se manda como Authorization: Bearer. El
 * refresh token vive en una cookie HttpOnly que el navegador maneja solo
 * (credentials: 'include'); §9 del prompt maestro.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string>;
  readonly requestId?: string;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    fieldErrors?: Record<string, string>,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.requestId = requestId;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** No intentar refrescar la sesión ante un 401 (usado por login/refresh mismos). */
  skipAuthRetry?: boolean;
}

interface AuthHandlers {
  getAccessToken: () => string | null;
  /** Debe devolver el nuevo access token, o null si el refresh falló. */
  refreshAccessToken: () => Promise<string | null>;
  onSessionExpired: () => void;
}

let authHandlers: AuthHandlers | null = null;

/** AuthProvider se registra aquí una vez al montar (evita import circular). */
export function registerAuthHandlers(handlers: AuthHandlers): void {
  authHandlers = handlers;
}

async function parseErrorBody(response: Response) {
  try {
    return (await response.json()) as {
      message?: string;
      code?: string;
      fieldErrors?: Record<string, string>;
      requestId?: string;
    };
  } catch {
    return {};
  }
}

async function rawFetch(path: string, options: ApiRequestOptions): Promise<Response> {
  const { body, headers, skipAuthRetry: _skip, ...rest } = options;
  const accessToken = authHandlers?.getAccessToken();

  return fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let response = await rawFetch(path, options);

  if (response.status === 401 && !options.skipAuthRetry && authHandlers) {
    const newToken = await authHandlers.refreshAccessToken();
    if (newToken) {
      response = await rawFetch(path, options);
    } else {
      authHandlers.onSessionExpired();
    }
  }

  if (!response.ok) {
    const payload = await parseErrorBody(response);
    throw new ApiError(
      payload.message ?? 'Ocurrió un error al comunicarse con el servidor.',
      response.status,
      payload.code,
      payload.fieldErrors,
      payload.requestId,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/**
 * Igual que `apiFetch` (mismo manejo de auth/refresh) pero para respuestas
 * binarias (ej. exportaciones PDF) — nunca intenta `response.json()`.
 */
export async function apiFetchBlob(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Blob> {
  let response = await rawFetch(path, options);

  if (response.status === 401 && !options.skipAuthRetry && authHandlers) {
    const newToken = await authHandlers.refreshAccessToken();
    if (newToken) {
      response = await rawFetch(path, options);
    } else {
      authHandlers.onSessionExpired();
    }
  }

  if (!response.ok) {
    const payload = await parseErrorBody(response);
    throw new ApiError(
      payload.message ?? 'Ocurrió un error al comunicarse con el servidor.',
      response.status,
      payload.code,
      payload.fieldErrors,
      payload.requestId,
    );
  }

  return response.blob();
}
