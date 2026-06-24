'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, LogIn } from 'lucide-react';
import { SearchBox } from './SearchBox';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useT } from '@/lib/i18n-client';
import { getUser } from '@/lib/cookies';

/** Desktop top bar (QuickMart-style) — global search + area + theme + user. >= lg only. */
export function Topbar() {
  const t = useT();
  const [user, setUser] = useState<ReturnType<typeof getUser> | null>(null);

  // Read the session client-side after mount to avoid an SSR hydration mismatch.
  useEffect(() => {
    setUser(getUser());
  }, []);

  const initial = user?.fullName?.trim()?.[0]?.toUpperCase() ?? 'U';

  return (
    <header className="topbar">
      <div className="topbar-search">
        <SearchBox placeholder={t('home.searchPlaceholder')} />
      </div>

      <div className="topbar-actions">
        {user?.primaryPincode ? (
          <span className="topbar-area">
            <MapPin size={15} />
            {user.primaryPincode}
          </span>
        ) : null}

        <ThemeToggle variant="button" />

        {user ? <NotificationBell /> : null}

        {user ? (
          <Link href="/profile" className="topbar-user" title={user.fullName ?? ''}>
            <span className="topbar-avatar">{initial}</span>
          </Link>
        ) : (
          <Link href="/login" className="topbar-login">
            <LogIn size={16} />
            {t('auth.title')}
          </Link>
        )}
      </div>
    </header>
  );
}
