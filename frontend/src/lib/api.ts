import {
  clearSession,
  readAccessToken,
  readOrganizationId,
  readRefreshToken,
} from './session';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
let refreshInFlight: Promise<string | null> | null = null;

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function extractMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object' || !('message' in payload)) {
    return fallback;
  }
  const message = (payload as { message?: unknown }).message;
  if (Array.isArray(message)) return message.map(String).join(', ');
  return typeof message === 'string' ? message : fallback;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return null as T;
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      extractMessage(payload, `Request failed (${response.status})`),
      response.status,
      payload,
    );
  }
  return unwrap<T>(payload);
}

async function refreshSession(): Promise<string | null> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${apiBase}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const auth = await parseResponse<{
        accessToken: string;
        refreshToken: string;
      }>(response);
      sessionStorage.setItem('procurement.access-token', auth.accessToken);
      sessionStorage.setItem('procurement.refresh-token', auth.refreshToken);
      return auth.accessToken;
    } catch {
      clearSession();
      window.dispatchEvent(new Event('procurement:session-expired'));
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  organization?: boolean;
  idempotencyKey?: string;
  retryAuth?: boolean;
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const {
    body,
    organization = true,
    idempotencyKey,
    retryAuth = true,
    headers: customHeaders,
    ...init
  } = options;
  const headers = new Headers(customHeaders);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const token = readAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const organizationId = organization ? readOrganizationId() : null;
  if (organizationId) headers.set('X-Organization-Id', organizationId);
  if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey);

  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'omit',
  });

  if (
    response.status === 401 &&
    retryAuth &&
    token &&
    path !== '/auth/refresh'
  ) {
    const nextToken = await refreshSession();
    if (nextToken) return request<T>(path, { ...options, retryAuth: false });
  }
  return parseResponse<T>(response);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export function unwrapApiResponse<T>(payload: unknown) {
  return unwrap<T>(payload);
}

export function normalizeApiError(payload: unknown, status: number) {
  return new ApiError(
    extractMessage(payload, `Request failed (${status})`),
    status,
    payload,
  );
}
