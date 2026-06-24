'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Slide-up bottom sheet used for selections on mobile (centres as a modal on
 * desktop). Closes on overlay click or Escape. Mirrors the mobile app's
 * bottom-sheet pickers.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        {title ? (
          <div className="sheet-head">
            <span className="sheet-title">{title}</span>
            <button className="sheet-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        ) : null}
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
