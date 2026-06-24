'use client';

import { useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { AreaSheet } from './AreaSheet';
import { useT } from '@/lib/i18n-client';
import type { Area } from '@/lib/types';

/**
 * Area / pincode selector: a field button (replacing a native <select>) that
 * opens the shared bottom sheet. Used on the RFQ and Onboarding forms.
 */
export function AreaPicker({
  areas,
  value,
  onChange,
  placeholder,
  showState = false,
}: {
  areas: Area[];
  value: string;
  onChange: (pincode: string) => void;
  placeholder?: string;
  showState?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const selected = areas.find((a) => a.pincode === value);
  const label = (a: Area) =>
    showState ? `${a.city}, ${a.state} (${a.pincode})` : `${a.city} (${a.pincode})`;

  return (
    <>
      <button type="button" className="field-button" onClick={() => setOpen(true)}>
        <MapPin size={17} className="fb-icon" />
        {selected ? (
          <span className="fb-label">{label(selected)}</span>
        ) : (
          <span className="fb-placeholder">{placeholder ?? t('profile.switchArea')}</span>
        )}
        <ChevronDown size={17} className="fb-icon" />
      </button>

      <AreaSheet
        open={open}
        onClose={() => setOpen(false)}
        areas={areas}
        selected={value}
        showState={showState}
        title={placeholder ?? t('profile.switchArea')}
        onSelect={(pincode) => {
          onChange(pincode);
          setOpen(false);
        }}
      />
    </>
  );
}
