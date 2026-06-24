import { COOKIES } from './config';
import type { User } from './types';

// Client-side cookie access. Tokens live in cookies (not localStorage) so server
// components can read them for SSR. Non-httpOnly (set from JS) — acceptable for
// MVP; flagged in the test guide.

const DAYS = 30;

export function setCookie(name: string, value: string, days = DAYS): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${
    days * 86400
  };samesite=lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name + '=([^;]*)'),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function delCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;path=/;max-age=0`;
}

// ── Auth session (client) ──────────────────────────────────────────────
export const getToken = () => getCookie(COOKIES.accessToken);
export const getRefresh = () => getCookie(COOKIES.refreshToken);

export function getUser(): User | null {
  const raw = getCookie(COOKIES.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setSession(s: {
  accessToken: string;
  refreshToken: string;
  user: User;
}): void {
  setCookie(COOKIES.accessToken, s.accessToken);
  setCookie(COOKIES.refreshToken, s.refreshToken);
  setCookie(COOKIES.user, JSON.stringify(s.user));
}

export function setUser(user: User): void {
  setCookie(COOKIES.user, JSON.stringify(user));
}

export function setAccessToken(token: string): void {
  setCookie(COOKIES.accessToken, token);
}

export function clearSession(): void {
  delCookie(COOKIES.accessToken);
  delCookie(COOKIES.refreshToken);
  delCookie(COOKIES.user);
}

export function setLocaleCookie(locale: string): void {
  setCookie(COOKIES.locale, locale, 365);
}
