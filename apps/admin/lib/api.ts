export const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1';

const TOKEN_KEY = 'nirmaan_admin_token';
const ROLE_KEY = 'nirmaan_admin_role';

export type AdminRole = 'SUPER_ADMIN' | 'OPS' | 'SUPPORT' | 'VIEWER';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function getRole(): AdminRole | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ROLE_KEY) as AdminRole | null;
}

export function setRole(role: string): void {
  window.localStorage.setItem(ROLE_KEY, role);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) || res.statusText || 'Request failed';
    throw new ApiError(
      Array.isArray(message) ? message.join(', ') : String(message),
      res.status,
    );
  }
  return data as T;
}
