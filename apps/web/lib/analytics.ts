import { API_URL, COOKIES } from './config';
import { getCookie, setCookie, getToken } from './cookies';
import { telemetry } from './telemetry';

/**
 * Business-signal pipe (PRD-00 §3.12, PRD-03 §7). Mirrors the mobile track()
 * model and reuses the same event contract. Goes to OUR backend (POST /events);
 * UX telemetry goes to PostHog via ./telemetry — never through here.
 *
 * anonymousId lives in a FIRST-PARTY COOKIE (not localStorage) so it survives
 * the SSR/CSR boundary (PRD-03 §7). userId is attached server-side from the JWT;
 * we never send it in the body, and we keep PII out of `properties`.
 */
interface Dimensions {
  pincode?: string;
  categoryId?: string;
  catalogItemId?: string;
  supplierId?: string;
  properties?: Record<string, unknown>;
}

interface QueuedEvent extends Dimensions {
  eventType: string;
  anonymousId: string;
}

const FLUSH_SIZE = 20;
const FLUSH_INTERVAL_MS = 15_000;
const SOURCE = 'WEB';

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Read (or lazily create) the device's pseudonymous id from a first-party cookie. */
export function getAnonymousId(): string {
  let id = getCookie(COOKIES.anonymousId);
  if (!id) {
    id = uuid();
    setCookie(COOKIES.anonymousId, id, 365);
  }
  return id;
}

let buffer: QueuedEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let started = false;

async function postEvents(events: QueuedEvent[]): Promise<boolean> {
  if (events.length === 0) return true;
  try {
    const token = getToken();
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      keepalive: true, // let it complete during page unload
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ source: SOURCE, events }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  const ok = await postEvents(batch);
  if (!ok) buffer = [...batch, ...buffer]; // keep for retry
}

/** Record a business-signal event. No-op on the server (never in the SSR path). */
export function track(eventType: string, dims: Dimensions = {}): void {
  if (typeof window === 'undefined') return;
  buffer.push({ eventType, anonymousId: getAnonymousId(), ...dims });
  if (buffer.length >= FLUSH_SIZE) void flush();
}

/** Stitch the anonymous journey to the account on login (PRD-03 §7). */
export function identify(userId: string): void {
  track('user.identified', { properties: { anonymousId: getAnonymousId() } });
  telemetry.identify(userId, getAnonymousId());
  void flush();
}

/** Start timers + flush-on-hide. Returns a cleanup fn. Client-only. */
export function initAnalytics(): () => void {
  if (started || typeof window === 'undefined') return () => {};
  started = true;
  getAnonymousId();

  timer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') void flush();
  };
  const onPageHide = () => void flush();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onPageHide);

  return () => {
    if (timer) clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', onPageHide);
    started = false;
  };
}
