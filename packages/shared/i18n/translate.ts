import en from './en.json';
import hi from './hi.json';

export type Locale = 'en' | 'hi';

export const dictionaries: Record<Locale, unknown> = { en, hi };

function lookup(table: unknown, key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      table,
    );
  return typeof value === 'string' ? value : undefined;
}

function interpolate(
  str: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );
}

/**
 * THE canonical UI-string resolver, shared by the mobile and web apps so there
 * is exactly one i18n implementation + one set of en/hi files (PRD-00 §3.3).
 * Falls back to English, then to the key itself — a missing translation never
 * blanks the screen.
 */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const hit = lookup(dictionaries[locale], key) ?? lookup(dictionaries.en, key);
  return interpolate(hit ?? key, vars);
}
