'use client';

import { Bell } from 'lucide-react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

/**
 * Notifications (PRD-03 §4.10). Read side of PRD-01 §18. The list/badge poll
 * (refetchInterval in the hooks) so a new notification shows without a manual
 * refresh while the page is open — the polling stand-in for the WebSocket
 * channel flagged in PENDING-REVIEW.
 */
export default function NotificationsPage() {
  const t = useT();
  const { ready } = useAuthGuard();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => !n.isRead);

  const label = (type: string) => {
    const key = `notifications.type.${type}`;
    const translated = t(key);
    return translated === key ? t('notifications.type.broadcast') : translated;
  };

  return (
    <>
      <div className="row" style={{ alignItems: 'center', gap: 8 }}>
        <h1 className="page-title" style={{ flex: 1 }}>
          {t('notifications.title')}
        </h1>
        {hasUnread ? (
          <button onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            {t('notifications.markAllRead')}
          </button>
        ) : null}
      </div>

      {!ready || isLoading ? (
        <SkeletonList rows={4} />
      ) : items.length === 0 ? (
        <EmptyState Icon={Bell} title={t('notifications.empty')} />
      ) : (
        items.map((n) => (
          <button
            key={n.id}
            className="card"
            onClick={() => !n.isRead && markRead.mutate(n.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              width: '100%',
              textAlign: 'left',
              background: n.isRead ? undefined : 'var(--primary-muted, rgba(0,0,0,0.04))',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                marginTop: 6,
                flexShrink: 0,
                background: n.isRead ? 'transparent' : 'var(--primary, #2563eb)',
              }}
            />
            <span style={{ flex: 1 }}>
              <strong style={{ fontWeight: n.isRead ? 400 : 600 }}>{label(n.type)}</strong>
              <div className="meta">{new Date(n.createdAt).toLocaleString()}</div>
            </span>
          </button>
        ))
      )}
    </>
  );
}
