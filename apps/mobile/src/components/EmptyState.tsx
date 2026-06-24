import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { AppText } from './Typography';

interface Props {
  icon?: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
  style?: ViewStyle;
}

/**
 * Reusable empty-state placeholder (PRD-02 §4 design-system intent). Use anywhere
 * a list/section can render with no data — e.g. Home "Popular near you".
 */
export function EmptyState({
  icon = 'info',
  title,
  body,
  actionLabel,
  onAction,
  compact,
  style,
}: Props) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.wrap, compact && styles.compact, style]}>
      <View style={styles.badge}>
        <Icon name={icon} size={26} color={t.colors.primary} />
      </View>
      <AppText variant="subtitle" center>
        {title}
      </AppText>
      {body ? (
        <AppText variant="body" color="muted" center style={styles.body}>
          {body}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          variant="secondary"
          onPress={onAction}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.lg,
      ...t.elevation.sm,
    },
    compact: { paddingVertical: 22 },
    badge: {
      width: 56,
      height: 56,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
    },
    body: { marginTop: 6 },
    action: { marginTop: 16, alignSelf: 'stretch' },
  });
