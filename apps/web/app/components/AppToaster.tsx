'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

/**
 * Sonner toaster (same toast library as the admin panel), themed to follow the
 * app's light/dark mode by watching the <html data-theme> attribute the
 * ThemeToggle / no-flash script set.
 */
export function AppToaster() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const read = () => {
      const t = document.documentElement.getAttribute('data-theme');
      if (t === 'light' || t === 'dark') setTheme(t);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, []);

  return (
    <Toaster position="bottom-center" theme={theme} richColors closeButton />
  );
}
