'use client';

import { Globe, Check } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useLocale, useT } from '@/lib/i18n-client';
import type { Locale } from '@nirmaan/shared';

const OPTIONS: { value: Locale; native: string }[] = [
  { value: 'en', native: 'English' },
  { value: 'hi', native: 'हिन्दी' },
];

/** Language chooser bottom sheet (English / हिन्दी) — mirrors the mobile picker. */
export function LanguageSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const { locale, setLocale } = useLocale();

  return (
    <BottomSheet open={open} onClose={onClose} title={t('profile.language')}>
      {OPTIONS.map((o) => {
        const active = locale === o.value;
        return (
          <button
            key={o.value}
            className={`sheet-option${active ? ' selected' : ''}`}
            onClick={() => {
              setLocale(o.value);
              onClose();
            }}
          >
            <Globe size={17} />
            {o.native}
            {active ? <Check size={18} className="so-check" /> : null}
          </button>
        );
      })}
    </BottomSheet>
  );
}
