'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

const STORAGE_KEY = 'nirmaan_theme';

/** Apply a concrete theme to <html> (and persist it). Default is dark. */
function apply(dark: boolean) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

/**
 * Binary light/dark control — matches the mobile app's Dark Mode switch.
 * `variant="switch"` is a toggle (used in the Profile settings row);
 * `variant="button"` is an icon button (used in the desktop top bar).
 * Persisted to localStorage; the no-flash script in layout.tsx applies it
 * before first paint (default: dark).
 */
export function ThemeToggle({ variant = 'switch' }: { variant?: 'switch' | 'button' }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setDark(stored !== 'light'); // default + any legacy value => dark
  }, []);

  const set = (next: boolean) => {
    setDark(next);
    localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    apply(next);
  };

  if (variant === 'button') {
    return (
      <button
        className="theme-btn"
        onClick={() => set(!dark)}
        aria-label="Toggle dark mode"
        title="Toggle dark mode"
      >
        {dark ? <Sun size={17} /> : <Moon size={17} />}
      </button>
    );
  }

  return (
    <button
      role="switch"
      aria-checked={dark}
      className={`switch${dark ? ' on' : ''}`}
      onClick={() => set(!dark)}
      aria-label="Dark mode"
    >
      <span className="switch-thumb" />
    </button>
  );
}
