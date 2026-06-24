import React from 'react';
import { Icon, type IconName } from './Icon';

/**
 * "My Truck" icon (PRD-02 §3.8). The glyph reflects cart fullness; the tab LABEL
 * always stays "My Truck" (handled by the navigator). Vector (lucide) so it tints
 * with the active/inactive tab colour, unlike the old emoji.
 *
 *   0      empty cart
 *   1+     truck
 */
export function truckIconForCount(count: number): IconName {
  return count <= 0 ? 'cart' : 'truck';
}

export function TruckIcon({
  count,
  size = 22,
  color,
}: {
  count: number;
  size?: number;
  color?: string;
}) {
  return <Icon name={truckIconForCount(count)} size={size} color={color} />;
}
