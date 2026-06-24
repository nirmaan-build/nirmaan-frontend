'use client';

import { MapPin, Check } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useT } from '@/lib/i18n-client';
import type { Area } from '@/lib/types';

/** Area / pincode chooser as a bottom sheet (shared by header, profile, pickers). */
export function AreaSheet({
  open,
  onClose,
  areas,
  selected,
  onSelect,
  showState = false,
  title,
}: {
  open: boolean;
  onClose: () => void;
  areas: Area[];
  selected?: string;
  onSelect: (pincode: string) => void;
  showState?: boolean;
  title?: string;
}) {
  const t = useT();
  const label = (a: Area) =>
    showState ? `${a.city}, ${a.state} (${a.pincode})` : `${a.city} (${a.pincode})`;

  return (
    <BottomSheet open={open} onClose={onClose} title={title ?? t('profile.switchArea')}>
      {areas.map((a) => {
        const isSel = a.pincode === selected;
        return (
          <button
            key={a.pincode}
            className={`sheet-option${isSel ? ' selected' : ''}`}
            onClick={() => onSelect(a.pincode)}
          >
            <MapPin size={17} />
            {label(a)}
            {isSel ? <Check size={18} className="so-check" /> : null}
          </button>
        );
      })}
    </BottomSheet>
  );
}
