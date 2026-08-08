/**
 * Cliente HTTP mínimo para la API. Usa cookies HttpOnly de sesión
 * (credentials: 'include'); el access token NUNCA se guarda en localStorage
 * (§9 Frontend React del prompt maestro). La lógica real de refresh y manejo
 * de 401 se implementa en la Fase 2 junto con AuthModule.
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
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let payload: {
      message?: string;
      code?: string;
      fieldErrors?: Record<string, string>;
      requestId?: string;
    } = {};
    try {
      payload = await response.json();
    } catch {
      // respuesta sin cuerpo JSON; se mantiene el mensaje genérico
    }
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
