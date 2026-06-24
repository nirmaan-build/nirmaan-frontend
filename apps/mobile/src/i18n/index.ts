// The translation files + translate() now live in @nirmaan/shared (single source
// of truth, shared with the web app). This module only adds the RN store binding.
import { translate, type Locale } from '@nirmaan/shared';
import { useSettingsStore } from '../store/settingsStore';

export { translate };
export type { Locale };

/** Hook returning a `t(key, vars)` bound to the current locale. */
export function useT() {
  const locale = useSettingsStore((s) => s.locale);
  return (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}
