'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MapPin, LogIn, ChevronDown, ArrowLeft, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from './ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { AreaSheet } from './AreaSheet';
import { useT } from '@/lib/i18n-client';
import { getUser, setUser as setUserCookie, USER_UPDATED_EVENT } from '@/lib/cookies';
import { useActiveAreas, useUpdateArea } from '@/lib/queries';

// Routes where the top-level brand/search bar is shown; everything else is a sub-page.
const TAB_ROUTES = ['/', '/categories', '/truck', '/profile'];
const NO_TOPBAR = ['/login', '/onboarding'];

/** Desktop top bar (>= lg). Shows back button + page title on sub-pages,
 *  or global search + area + user on tab routes. */
export function Topbar() {
  const t = useT();
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getUser> | null>(null);
  const [areaOpen, setAreaOpen] = useState(false);
  const { data: areas } = useActiveAreas();
  const updateArea = useUpdateArea();

  // Sync from cookie on mount AND whenever any component calls setUser() (e.g. Profile area change).
  useEffect(() => {
    const sync = () => setUser(getUser());
    sync();
    window.addEventListener(USER_UPDATED_EVENT, sync);
    return () => window.removeEventListener(USER_UPDATED_EVENT, sync);
  }, []);

  if (NO_TOPBAR.includes(pathname)) return null;

  const initial = user?.fullName?.trim()?.[0]?.toUpperCase() ?? 'U';
  const isTabRoute = TAB_ROUTES.includes(pathname);

  const onSelectArea = async (pincode: string) => {
    setAreaOpen(false);
    try {
      const u = await updateArea.mutateAsync(pincode);
      setUserCookie(u); // also fires USER_UPDATED_EVENT → MobileHeader syncs too
      setUser(u);
      const city = areas?.find((a) => a.pincode === pincode)?.city ?? pincode;
      toast.success(t('header.areaUpdated'), { description: city });
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  const city =
    areas?.find((a) => a.pincode === user?.primaryPincode)?.city ??
    user?.primaryPincode ??
    null;

  return (
    <>
      <header className="topbar">
        {/* Sub-page: back button; tab-route: brand name */}
        {!isTabRoute ? (
          <button
            className="icon-btn topbar-back"
            aria-label={t('common.back') ?? 'Back'}
            onClick={() => router.back()}
          >
            <ArrowLeft size={20} />
          </button>
        ) : (
          <Link href="/" className="topbar-brand">
            {t('common.appName')}
          </Link>
        )}

        <div className="topbar-actions">
          {/* Clickable area pill — opens AreaSheet for desktop users (Bug 2) */}
          {user?.primaryPincode ? (
            <button
              className="topbar-area"
              onClick={() => setAreaOpen(true)}
              title={t('header.switchArea')}
            >
              <MapPin size={15} />
              {city ?? user.primaryPincode}
              <ChevronDown size={13} />
            </button>
          ) : null}

          <button
            className="icon-btn"
            onClick={() => router.refresh()}
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCcw size={17} />
          </button>

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

      {user ? (
        <AreaSheet
          open={areaOpen}
          onClose={() => setAreaOpen(false)}
          areas={areas ?? []}
          selected={user.primaryPincode ?? undefined}
          title={t('header.switchArea')}
          onSelect={onSelectArea}
        />
      ) : null}
    </>
  );
}
