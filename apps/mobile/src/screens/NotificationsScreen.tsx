import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useThemedStyles, useTheme, type Theme } from '../theme';
import { useT } from '../i18n';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type NotificationRow,
} from '../api/hooks';
import { AppText } from '../components/Typography';
import { Icon } from '../components/Icon';

/**
 * Notifications (PRD-02 §3.13). Read side of PRD-01 §18. The list polls
 * (refetchInterval in the hook) so a new notification appears without a manual
 * refresh while the screen is open — the polling stand-in for the WebSocket
 * channel flagged in PENDING-REVIEW.
 */
export function NotificationsScreen() {
  const t = useT();
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const hasUnread = items.some((n: NotificationRow) => !n.isRead);

  const label = (type: string) => {
    const key = `notifications.type.${type}`;
    const translated = t(key);
    // Unknown/new types fall back to a generic line rather than the raw key.
    return translated === key ? t('notifications.type.broadcast') : translated;
  };

  return (
    <View style={styles.container}>
      {hasUnread ? (
        <Pressable
          style={styles.markAll}
          onPress={() => markAll.mutate()}
          disabled={markAll.isPending}
        >
          <Icon name="check" size={16} color={th.colors.primary} />
          <AppText variant="label" color="primary">
            {t('notifications.markAllRead')}
          </AppText>
        </Pressable>
      ) : null}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : items.length === 0 ? (
        <AppText variant="body" color="muted" style={styles.empty}>
          {t('notifications.empty')}
        </AppText>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {items.map((n: NotificationRow) => (
            <Pressable
              key={n.id}
              style={[styles.row, !n.isRead && styles.rowUnread]}
              onPress={() => !n.isRead && markRead.mutate(n.id)}
            >
              {!n.isRead ? <View style={styles.dot} /> : <View style={styles.dotSpace} />}
              <View style={styles.flex}>
                <AppText variant={n.isRead ? 'body' : 'bodyStrong'}>
                  {label(n.type)}
                </AppText>
                <AppText variant="caption" color="muted">
                  {new Date(n.createdAt).toLocaleString()}
                </AppText>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    markAll: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    empty: { textAlign: 'center', marginTop: 48 },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: t.colors.card,
      borderRadius: t.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: 14,
      marginBottom: 10,
    },
    rowUnread: { backgroundColor: t.colors.primaryMuted },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
      backgroundColor: t.colors.primary,
    },
    dotSpace: { width: 8 },
    flex: { flex: 1, gap: 3 },
  });
