import { AppState, type AppStateStatus } from 'react-native';
import { API_URL } from '../config';
import { storage, KEYS } from './storage';
import { useAuthStore } from '../store/authStore';
import { telemetry } from './telemetry';

/**
 * Business-signal pipe (PRD-00 §3.12, PRD-02 §6). A thin track() wrapper that
 * buffers events in memory and flushes in batches — on a size threshold, on a
 * timer, and on app background. Events queue locally (MMKV) while offline and
 * replay on reconnect/launch, so low-connectivity users aren't dropped.
 *
 * This pipe goes to OUR backend (POST /events). UX telemetry (screen views,
 * scroll) goes to PostHog via ./telemetry — never through here.
 *
 * Privacy (PRD-00 §3.12.4): only the pseudonymous anonymousId travels on the
 * wire; never put names/phones in `properties`. userId is attached server-side
 * from the JWT — we never send it in the body.
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
const MAX_QUEUE = 200;
const SOURCE = 'MOBILE';

/** RFC4122-ish v4 id without a native crypto dependency (fine for a pseudonymous id). */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getAnonymousId(): string {
  let id = storage.get(KEYS.anonymousId);
  if (!id) {
    id = uuid();
    storage.set(KEYS.anonymousId, id);
  }
  return id;
}

let buffer: QueuedEvent[] = [];
let timer: ReturnType<typeof setInterval> | null = null;
let started = false;

function loadQueue(): QueuedEvent[] {
  const raw = storage.get(KEYS.eventQueue);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedEvent[];
  } catch {
    return [];
  }
}

function saveQueue(events: QueuedEvent[]): void {
  if (events.length === 0) storage.del(KEYS.eventQueue);
  else storage.set(KEYS.eventQueue, JSON.stringify(events.slice(-MAX_QUEUE)));
}

async function postEvents(events: QueuedEvent[]): Promise<boolean> {
  if (events.length === 0) return true;
  try {
    const token = useAuthStore.getState().accessToken;
    const res = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ source: SOURCE, events }),
    });
    return res.ok;
  } catch {
    return false; // offline / unreachable — keep for retry
  }
}

/** Send everything buffered + previously-queued-offline. Never throws. */
export async function flush(): Promise<void> {
  const all = [...loadQueue(), ...buffer];
  buffer = [];
  if (all.length === 0) {
    saveQueue([]);
    return;
  }
  const ok = await postEvents(all);
  saveQueue(ok ? [] : all);
}

/** Record a business-signal event (fire-and-forget). */
export function track(eventType: string, dims: Dimensions = {}): void {
  buffer.push({
    eventType,
    anonymousId: getAnonymousId(),
    pincode: dims.pincode,
    categoryId: dims.categoryId,
    catalogItemId: dims.catalogItemId,
    supplierId: dims.supplierId,
    properties: dims.properties,
  });
  if (buffer.length >= FLUSH_SIZE) void flush();
}

/**
 * Stitch the pre-signup anonymous journey to the account (PRD-02 §6.1). The
 * backend reads userId from the JWT on /events; we just emit a marker carrying
 * the device anonymousId, and tell PostHog to alias.
 */
export function identify(userId: string): void {
  track('user.identified', { properties: { anonymousId: getAnonymousId() } });
  telemetry.identify(userId, getAnonymousId());
  void flush();
}

/** Wire up timers, app-state flushing, and anonymous→identified stitching. */
export function initAnalytics(): () => void {
  if (started) return () => {};
  started = true;
  getAnonymousId(); // ensure it exists on first launch

  timer = setInterval(() => void flush(), FLUSH_INTERVAL_MS);

  const onState = (state: AppStateStatus) => {
    // Flush when backgrounding (don't lose buffered events), and on resume
    // (replay anything queued while offline).
    if (state === 'background' || state === 'inactive' || state === 'active') {
      void flush();
    }
  };
  const sub = AppState.addEventListener('change', onState);

  // Stitch on login without a circular import: react to the auth store.
  let lastUserId: string | null = useAuthStore.getState().user?.id ?? null;
  const unsub = useAuthStore.subscribe((state) => {
    const id = state.user?.id ?? null;
    if (id && id !== lastUserId) {
      lastUserId = id;
      identify(id);
    }
  });

  void flush(); // replay any offline queue on launch

  return () => {
    if (timer) clearInterval(timer);
    sub.remove();
    unsub();
    started = false;
  };
}
