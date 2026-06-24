'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { translate, type Locale } from '@nirmaan/shared';
import { setLocaleCookie } from './cookies';

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

const Ctx = createContext<LocaleCtx>({ locale: 'en', setLocale: () => {} });

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setLocaleCookie(l);
    // SSR pages read the locale cookie, so refresh to re-render them localized.
    if (typeof window !== 'undefined') window.location.reload();
  }, []);
  return <Ctx.Provider value={{ locale, setLocale }}>{children}</Ctx.Provider>;
}

export function useLocale() {
  return useContext(Ctx);
}

/** Client-component translate bound to the current locale (shared dictionaries). */
export function useT() {
  const { locale } = useLocale();
  return (key: string, vars?: Record<string, string | number>) =>
    translate(locale, key, vars);
}
