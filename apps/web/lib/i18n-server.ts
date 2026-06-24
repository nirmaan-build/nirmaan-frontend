import { translate } from '@nirmaan/shared';
import { serverLocale } from './serverApi';

/** Server-component translate, using the locale cookie (shared dictionaries). */
export function st(key: string, vars?: Record<string, string | number>): string {
  return translate(serverLocale(), key, vars);
}
