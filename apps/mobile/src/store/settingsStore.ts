import { create } from 'zustand';
import { storage, KEYS } from '../lib/storage';

export type Locale = 'en' | 'hi';
export type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  locale: Locale;
  themeMode: ThemeMode;
  setLocale: (locale: Locale) => void;
  setThemeMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: 'en',
  themeMode: 'system',
  setLocale: (locale) => {
    set({ locale });
    void storage.set(KEYS.locale, locale);
  },
  setThemeMode: (themeMode) => {
    set({ themeMode });
    void storage.set(KEYS.themeMode, themeMode);
  },
  hydrate: async () => {
    const storedLocale = await storage.get(KEYS.locale);
    if (storedLocale === 'en' || storedLocale === 'hi') {
      set({ locale: storedLocale });
    }
    const storedMode = await storage.get(KEYS.themeMode);
    if (
      storedMode === 'light' ||
      storedMode === 'dark' ||
      storedMode === 'system'
    ) {
      set({ themeMode: storedMode });
    }
  },
}));
