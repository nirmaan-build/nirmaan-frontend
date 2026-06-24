'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/nav';
import { useT } from '@/lib/i18n-client';

/** Fixed bottom tab bar — mobile only (hidden at the lg breakpoint). PRD-03 §3. */
export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="nav-bottom">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link key={item.key} href={item.href} className={active ? 'active' : ''}>
            <span className="nav-icon">
              <Icon size={21} strokeWidth={active ? 2.4 : 2} />
            </span>
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
