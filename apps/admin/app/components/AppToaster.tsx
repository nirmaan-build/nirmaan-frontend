'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { usePathname } from 'next/navigation';

export function AppToaster() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    if (current === 'light' || current === 'dark') setTheme(current);
    const obs = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      if (t === 'light' || t === 'dark') setTheme(t);
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => obs.disconnect();
  }, [pathname]);

  return (
    <Toaster position="bottom-right" theme={theme} richColors closeButton />
  );
}
