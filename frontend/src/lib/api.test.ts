import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import {
  ApiError,
  getErrorMessage,
  normalizeApiError,
  unwrapApiResponse,
} from './api';

const memory = new Map<string, string>();

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  memory.clear();
  vi.stubGlobal('sessionStorage', {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
    removeItem: (key: string) => memory.delete(key),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('API response handling', () => {
  it('unwraps the NestJS success envelope while accepting plain payloads', () => {
    expect(
      unwrapApiResponse({
        data: { id: 'request-1' },
        code: 200,
        message: 'ok',
      }),
    ).toEqual({ id: 'request-1' });
    expect(unwrapApiResponse([{ id: 'product-1' }])).toEqual([
      { id: 'product-1' },
    ]);
  });

  it('normalizes string and validation-array error messages', () => {
    expect(normalizeApiError({ message: 'Not allowed' }, 403)).toMatchObject({
      name: 'ApiError',
      message: 'Not allowed',
      status: 403,
    });
    const validationError = normalizeApiError(
      { message: ['title must not be empty', 'items is required'] },
      400,
    );
    expect(validationError.message).toBe(
      'title must not be empty, items is required',
    );
    expect(getErrorMessage(validationError)).toBe(
      'Check the entered values and try again.',
    );
  });

  it('preserves status and server details for conflict handling', () => {
    const error = normalizeApiError({ message: 'Request status changed' }, 409);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.details).toEqual({ message: 'Request status changed' });
  });

  it('sends the active bearer token, organization scope, and idempotency key', async () => {
    memory.set('procurement.access-token', 'access-token');
    memory.set('procurement.organization-id', 'org-123');
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        jsonResponse({ data: { id: 'created' } }, 201),
    );
    vi.stubGlobal('fetch', fetchMock);

    await api.post(
      '/purchase-requests',
      { title: 'Laptop request' },
      {
        idempotencyKey: 'retry-key-1',
      },
    );

    const requestInit = fetchMock.mock.calls[0]?.[1] ?? {};
    const headers = new Headers(requestInit.headers);
    expect(headers.get('Authorization')).toBe('Bearer access-token');
    expect(headers.get('X-Organization-Id')).toBe('org-123');
    expect(headers.get('Idempotency-Key')).toBe('retry-key-1');
    expect(JSON.parse(String(requestInit.body))).toEqual({
      title: 'Laptop request',
    });
  });

  it('refreshes an expired access token once and retries the original request', async () => {
    memory.set('procurement.access-token', 'expired-access');
    memory.set('procurement.refresh-token', 'refresh-token');
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith('/auth/refresh')) {
          return jsonResponse({
            data: {
              accessToken: 'rotated-access',
              refreshToken: 'rotated-refresh',
            },
          });
        }
        const authorization = new Headers(init?.headers).get('Authorization');
        if (authorization === 'Bearer expired-access') {
          return jsonResponse({ message: 'Unauthorized' }, 401);
        }
        return jsonResponse({ data: { ok: true } });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(api.get<{ ok: boolean }>('/protected')).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(memory.get('procurement.access-token')).toBe('rotated-access');
    expect(memory.get('procurement.refresh-token')).toBe('rotated-refresh');
  });
});
