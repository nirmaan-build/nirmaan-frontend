'use client';

import { useEffect } from 'react';
import { track } from '@/lib/analytics';

/**
 * Fires a business-signal event AFTER hydration (in an effect) — never in the
 * SSR request path (PRD-03 §7). Used to capture organic search landings, e.g. a
 * Google visitor arriving on /categories/<id> becomes a category.viewed with
 * that area's pincode context.
 */
export function TrackView({
  eventType,
  categoryId,
  catalogItemId,
  supplierId,
  pincode,
}: {
  eventType: string;
  categoryId?: string;
  catalogItemId?: string;
  supplierId?: string;
  pincode?: string;
}) {
  useEffect(() => {
    track(eventType, { categoryId, catalogItemId, supplierId, pincode });
  }, [eventType, categoryId, catalogItemId, supplierId, pincode]);
  return null;
}
