'use client';

import { useLocale } from '@/lib/i18n-client';
import type { Locale } from '@nirmaan/shared';

const OPTS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
];

export function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="pill-toggle">
      {OPTS.map((o) => (
        <button
          key={o.value}
          className={locale === o.value ? 'on' : ''}
          onClick={() => setLocale(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
