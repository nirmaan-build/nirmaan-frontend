'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Locale } from '@nirmaan/shared';
import { LocaleProvider } from '@/lib/i18n-client';
import { initAnalytics, identify } from '@/lib/analytics';
import { getUser } from '@/lib/cookies';

export function Providers({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );
  // Business-signal analytics: anonymousId cookie, batching, flush-on-hide,
  // and anonymous→identified stitching for already-signed-in users (PRD-03 §7).
  useEffect(() => {
    const cleanup = initAnalytics();
    const u = getUser();
    if (u?.id) identify(u.id);
    return cleanup;
  }, []);

  return (
    <QueryClientProvider client={client}>
      <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
    </QueryClientProvider>
  );
}
