'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MapPin, ChevronDown, User as UserIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { AreaSheet } from './AreaSheet';
import { NotificationBell } from './NotificationBell';
import { useHeaderTitle } from './HeaderTitle';
import { useActiveAreas, useUpdateArea } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { getUser, setUser as setUserCookie } from '@/lib/cookies';
import type { User } from '@/lib/types';

// The four bottom-tab routes show the brand header; everything else is a sub-page.
const TAB_ROUTES = ['/', '/categories', '/truck', '/profile'];
// Full-screen auth flow — no header at all.
const NO_HEADER = ['/login', '/onboarding'];

/**
 * Mobile chrome (< lg). On a tab route: the brand header (avatar + brand + area
 * selector), mirroring the RN app. On a sub-page: a back button + screen title,
 * and the brand header is hidden. Desktop uses the Topbar instead.
 */
export function MobileHeader() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const { title } = useHeaderTitle();
  const { data: areas } = useActiveAreas();
  const updateArea = useUpdateArea();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
  }, []);

  if (NO_HEADER.includes(pathname)) return null;

  // ── Sub-page: back button + title ──
  if (!TAB_ROUTES.includes(pathname)) {
    const mapped = subTitle(pathname, t);
    return (
      <header className="m-header m-subheader">
        <button className="m-back" onClick={() => router.back()} aria-label="Back">
          <ArrowLeft size={22} />
        </button>
        <span className="m-subtitle">{title ?? mapped}</span>
      </header>
    );
  }

  // ── Tab route: brand header ──
  const city =
    areas?.find((a) => a.pincode === user?.primaryPincode)?.city ??
    user?.primaryPincode ??
    null;
  const initial = user?.fullName?.trim()?.[0]?.toUpperCase() ?? '';

  const onSelect = async (pincode: string) => {
    setOpen(false);
    try {
      const updated = await updateArea.mutateAsync(pincode);
      setUserCookie(updated);
      setUser(updated);
      const newCity = areas?.find((a) => a.pincode === pincode)?.city ?? pincode;
      toast.success(t('header.areaUpdated'), { description: newCity });
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  return (
    <header className="m-header">
      <Link href={user ? '/profile' : '/login'} className="m-header-avatar" aria-label={t('profile.title')}>
        {initial ? <span>{initial}</span> : <UserIcon size={20} />}
      </Link>

      <div className="m-header-brand">
        <span className="m-brand">{t('common.appName')}</span>
        {user ? (
          <button className="m-header-area" onClick={() => setOpen(true)}>
            <MapPin size={14} />
            <span>{city ?? t('header.switchArea')}</span>
            <ChevronDown size={14} />
          </button>
        ) : (
          <Link href="/login" className="m-header-signin">
            {t('auth.title')}
          </Link>
        )}
      </div>

      {user ? (
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center' }}>
          <NotificationBell />
        </span>
      ) : null}

      <AreaSheet
        open={open}
        onClose={() => setOpen(false)}
        areas={areas ?? []}
        selected={user?.primaryPincode ?? undefined}
        title={t('header.switchArea')}
        onSelect={onSelect}
      />
    </header>
  );
}

/** Static title fallback for sub-pages (category name comes from HeaderTitle context). */
function subTitle(pathname: string, t: (k: string) => string): string {
  if (pathname === '/notifications') return t('notifications.title');
  if (pathname === '/callback') return t('callback.title');
  if (pathname.startsWith('/pay/')) return t('payLink.title');
  if (pathname === '/requirements') return t('requirements.title');
  if (pathname.startsWith('/rfq')) return t('postRfq.title');
  if (pathname === '/help') return t('content.help');
  if (pathname === '/privacy') return t('content.privacy');
  if (pathname === '/terms') return t('content.terms');
  if (pathname === '/popular') return t('home.popularNearYou');
  if (pathname.startsWith('/categories/')) return t('categories.title');
  return '';
}
