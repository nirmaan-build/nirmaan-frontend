'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HardHat, HelpCircle, PanelLeftClose, PanelLeftOpen, Store } from 'lucide-react';
import { NAV } from '@/lib/nav';
import { useT } from '@/lib/i18n-client';
import { getUser } from '@/lib/cookies';

/**
 * Desktop left sidebar (QuickMart-style chrome) — visible only at >= lg.
 * Same nav config as the mobile bottom bar (lib/nav.ts), rendered as a vertical
 * rail with a section label and a collapse toggle.
 */
export function Sidebar() {
  const pathname = usePathname();
  const t = useT();
  const [collapsed, setCollapsed] = useState(false);
  const user = getUser();
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-top">
        <Link href="/" className="sidebar-brand">
          <HardHat size={22} />
          <span className="sidebar-label">{t('common.appName')}</span>
        </Link>
        <button
          className="sidebar-collapse"
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section">
          <span className="sidebar-label">Menu</span>
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`sidebar-item${isActive(item.href) ? ' active' : ''}`}
              title={t(item.labelKey)}
            >
              <Icon size={19} />
              <span className="sidebar-label">{t(item.labelKey)}</span>
            </Link>
          );
        })}

        {/* My Store — only when user is a supplier */}
        {user?.isSupplier ? (
          <Link
            href="/supplier"
            className={`sidebar-item${isActive('/supplier') ? ' active' : ''}`}
            title={t('supplier.myStore')}
          >
            <Store size={19} />
            <span className="sidebar-label">{t('supplier.myStore')}</span>
          </Link>
        ) : null}
      </nav>

      <div className="sidebar-foot">
        <Link
          href="/help"
          className={`sidebar-item${isActive('/help') ? ' active' : ''}`}
          title={t('profile.help')}
        >
          <HelpCircle size={19} />
          <span className="sidebar-label">{t('profile.help')}</span>
        </Link>
      </div>
    </aside>
  );
}
