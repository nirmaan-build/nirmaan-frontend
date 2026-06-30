'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/nav';
import { useT } from '@/lib/i18n-client';
import { useCart } from '@/lib/queries';

/** Fixed bottom tab bar — mobile only (hidden at the lg breakpoint). PRD-03 §3. */
export function BottomNav() {
  const pathname = usePathname();
  const t = useT();
  const { data: cart } = useCart();

  // Group by item name (title) then count distinct groups — same as Myntra/Flipkart
  const itemNames = (cart?.items ?? []).map((i) => i.catalogItem.title);
  const uniqueItemCount = new Set(itemNames).size;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="nav-bottom">
      {NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        const isTruck = item.key === 'truck';
        return (
          <Link key={item.key} href={item.href} className={active ? 'active' : ''}>
            <span className="nav-icon" style={{ position: 'relative' }}>
              <Icon size={21} strokeWidth={active ? 2.4 : 2} />
              {isTruck && uniqueItemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    lineHeight: 1,
                  }}
                >
                  {uniqueItemCount > 99 ? '99+' : uniqueItemCount}
                </span>
              )}
            </span>
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
