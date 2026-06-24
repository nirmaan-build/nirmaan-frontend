import { MMKV } from 'react-native-mmkv';

/**
 * Token / preference storage backed by MMKV.
 *
 * Why MMKV over AsyncStorage: it's synchronous (C++/JSI), markedly faster, and
 * this app reads the access token on every API call — no async overhead, no
 * bridge round-trips. The get/set/del shape is unchanged, so callers that
 * `await storage.get(...)` keep working (awaiting a plain value is a no-op).
 *
 * Dev note: MMKV uses JSI, so it does NOT work under Chrome "Remote JS Debugging".
 * Use the Hermes debugger / Flipper instead.
 */
const mmkv = new MMKV({ id: 'nirmaan' });

export const storage = {
  get: (key: string): string | null => mmkv.getString(key) ?? null,
  set: (key: string, value: string): void => mmkv.set(key, value),
  del: (key: string): void => mmkv.delete(key),
};

export const KEYS = {
  accessToken: 'nirmaan.accessToken',
  refreshToken: 'nirmaan.refreshToken',
  user: 'nirmaan.user',
  locale: 'nirmaan.locale',
  themeMode: 'nirmaan.themeMode',
  // Analytics (PRD-02 §6): device-level pseudonymous id + offline event queue.
  anonymousId: 'nirmaan.anonymousId',
  eventQueue: 'nirmaan.eventQueue',
} as const;
