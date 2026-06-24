'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';

/** Header bell + unread badge (PRD-03 §4.10). Polls via useUnreadCount. */
export function NotificationBell() {
  const t = useT();
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;

  return (
    <Link
      href="/notifications"
      aria-label={t('notifications.title')}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      <Bell size={20} />
      {count > 0 ? (
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 8,
            background: 'var(--danger, #dc2626)',
            color: '#fff',
            fontSize: 10,
            lineHeight: '16px',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  );
}
