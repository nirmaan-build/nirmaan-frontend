import { cookies } from 'next/headers';
import { API_URL, COOKIES } from './config';
import type { Locale } from '@nirmaan/shared';

/**
 * Server-side fetch for SSR pages (Home/Categories/Category Page per PRD-03 §5).
 * Reads the access token from the cookie so a logged-in user gets server-rendered
 * data. Returns null on 401/empty (no server-side refresh) — the page renders a
 * signed-out shell and the client takes over.
 *
 * @param revalidate - ISR revalidation window in seconds. Omit (or pass 0) for
 *   user-specific/real-time data (defaults to no-store). Pass a positive number
 *   for semi-static public data like the categories list.
 */
export async function serverApi<T>(
  path: string,
  { revalidate }: { revalidate?: number } = {},
): Promise<T | null> {
  const token = cookies().get(COOKIES.accessToken)?.value;
  const nextOpts: RequestInit['next'] = revalidate
    ? { revalidate }
    : undefined;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      ...(nextOpts ? { next: nextOpts } : { cache: 'no-store' }),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

export function serverLocale(): Locale {
  const v = cookies().get(COOKIES.locale)?.value;
  return v === 'hi' ? 'hi' : 'en';
}

export function isAuthed(): boolean {
  return Boolean(cookies().get(COOKIES.accessToken)?.value);
}

export function serverPincode(): string | null {
  const raw = cookies().get(COOKIES.user)?.value;
  if (!raw) return null;
  try {
    return (JSON.parse(raw) as { primaryPincode?: string }).primaryPincode ?? null;
  } catch {
    return null;
  }
}
