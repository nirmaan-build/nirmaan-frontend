'use client';

import React from 'react';
import {
  Bell,
  CheckCheck,
  ShoppingCart,
  ClipboardList,
  MessageCircle,
  Megaphone,
  Package,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

/** Per-type icon + color. Falls back to Bell for unknown types. */
const TYPE_CONFIG: Record<string, { Icon: LucideIcon; color: string; bg: string }> = {
  order_status_changed:  { Icon: ShoppingCart,  color: '#4c8dff', bg: 'rgba(76,141,255,0.12)' },
  quote_received:        { Icon: ClipboardList,  color: '#35c46b', bg: 'rgba(53,196,107,0.12)' },
  rfq_matched:           { Icon: TrendingUp,     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  new_lead:              { Icon: Package,        color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  broadcast:             { Icon: Megaphone,      color: '#ff6b5e', bg: 'rgba(255,107,94,0.12)' },
  chat:                  { Icon: MessageCircle,  color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
};
const FALLBACK_CONFIG = { Icon: Bell, color: 'var(--primary)', bg: 'var(--primary-muted)' };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const t = useT();
  const { ready } = useAuthGuard();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const hasUnread = items.some((n: any) => !n.isRead);
  const unreadCount = items.filter((n: any) => !n.isRead).length;

  const label = (type: string) => {
    const key = `notifications.type.${type}`;
    const translated = t(key);
    return translated === key ? t('notifications.type.broadcast') : translated;
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h1 className="page-title" style={{ flex: 1, margin: 0 }}>
          {t('notifications.title')}
          {unreadCount > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                background: 'var(--primary)',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '0 5px',
                marginLeft: 10,
                verticalAlign: 'middle',
              }}
            >
              {unreadCount}
            </span>
          )}
        </h1>
        {hasUnread && (
          <button
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              minHeight: 34,
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--primary)',
              border: '1px solid var(--primary)',
              background: 'transparent',
              borderRadius: 'var(--r-md)',
            }}
          >
            <CheckCheck size={15} />
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {!ready || isLoading ? (
        <SkeletonList rows={5} />
      ) : items.length === 0 ? (
        <EmptyState
          Icon={Bell}
          title={t('notifications.empty')}
          subtitle="You're all caught up!"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((n: any) => {
            const cfg = TYPE_CONFIG[n.type] ?? FALLBACK_CONFIG;
            const { Icon, color, bg } = cfg;
            const unread = !n.isRead;
            return (
              <button
                key={n.id}
                onClick={() => unread && markRead.mutate(n.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  width: '100%',
                  textAlign: 'left',
                  background: unread ? 'var(--card)' : 'transparent',
                  border: `1px solid ${unread ? color : 'var(--border)'}`,
                  borderRadius: 'var(--r-lg)',
                  padding: '14px 16px',
                  minHeight: 0,
                  cursor: unread ? 'pointer' : 'default',
                  transition: 'border-color 0.15s, background 0.15s',
                  boxShadow: unread ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {/* Icon circle */}
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: bg,
                    color,
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <Icon size={18} />
                </span>

                {/* Content */}
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong
                      style={{
                        fontSize: 14,
                        fontWeight: unread ? 700 : 500,
                        color: 'var(--text)',
                        lineHeight: '20px',
                      }}
                    >
                      {label(n.type)}
                    </strong>
                    {unread && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: color,
                          flexShrink: 0,
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 12,
                      color: 'var(--muted)',
                      marginTop: 3,
                    }}
                  >
                    {timeAgo(n.createdAt)}
                  </span>
                  {n.message && (
                    <span
                      style={{
                        display: '-webkit-box',
                        fontSize: 13,
                        color: 'var(--muted)',
                        marginTop: 4,
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      } as React.CSSProperties}
                    >
                      {n.message}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
