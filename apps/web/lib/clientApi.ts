import { API_URL } from './config';
import {
  getToken,
  getRefresh,
  setAccessToken,
  clearSession,
} from './cookies';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function raw(
  path: string,
  options: RequestInit,
  token: string | null,
): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null };
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const rt = getRefresh();
  if (!rt) return null;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { ok, data } = await raw(
          '/auth/refresh',
          { method: 'POST', body: JSON.stringify({ refreshToken: rt }) },
          null,
        );
        if (ok && data?.accessToken) {
          setAccessToken(data.accessToken);
          return data.accessToken as string;
        }
        clearSession();
        return null;
      } catch {
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

/** Browser-side JSON request with one transparent refresh on 401. */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const { ok, status, data } = await raw(path, options, getToken());
  if (status === 401 && retry) {
    const fresh = await refreshAccess();
    if (fresh) return api<T>(path, options, false);
  }
  if (!ok) {
    const message = data?.message ?? data?.error ?? 'Request failed';
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : String(message),
      status,
      data?.error,
    );
  }
  return data as T;
}
