import { API_URL } from '../config';
import { useAuthStore } from '../store/authStore';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function rawFetch(
  path: string,
  options: RequestInit,
  token?: string | null,
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
  const data = text ? JSON.parse(text) : null;
  return { ok: res.ok, status: res.status, data };
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccess(): Promise<string | null> {
  const { refreshToken, setAccessToken, signOut } = useAuthStore.getState();
  if (!refreshToken) return null;
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { ok, data } = await rawFetch('/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
        if (ok && data?.accessToken) {
          await setAccessToken(data.accessToken);
          return data.accessToken as string;
        }
        await signOut();
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

/** Authenticated JSON request with one transparent token refresh on 401. */
export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const { ok, status, data } = await rawFetch(path, options, token);

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
