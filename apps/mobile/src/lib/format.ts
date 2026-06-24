import type { Unit } from '../api/types';

/** Formats a price-estimate (Prisma Decimal arrives as a string) as ₹. */
export function money(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(n)) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

/** A unit may arrive as a plain string or as a {id, name, shortCode} object. */
export function unitLabel(unit: Unit | null | undefined): string {
  if (!unit) return '';
  if (typeof unit === 'string') return unit;
  return unit.shortCode ?? unit.name ?? '';
}
