import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { Icon, type IconName } from './Icon';
import { AppText } from './Typography';

interface ToastInternalProps {
  text1?: string;
  text2?: string;
  props?: { actionLabel?: string; onAction?: () => void };
}

const META: Record<
  'success' | 'error' | 'info',
  { icon: IconName; color: keyof Theme['colors'] }
> = {
  success: { icon: 'success', color: 'ok' },
  error: { icon: 'alert', color: 'danger' },
  info: { icon: 'info', color: 'primary' },
};

function ToastCard({
  kind,
  text1,
  text2,
  props,
}: { kind: 'success' | 'error' | 'info' } & ToastInternalProps) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  const meta = META[kind];
  const accent = t.colors[meta.color];
  return (
    <View style={[styles.card, { borderLeftColor: accent }]}>
      <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
        <Icon name={meta.icon} size={20} color={accent} />
      </View>
      <View style={styles.body}>
        {text1 ? (
          <AppText variant="bodyStrong" numberOfLines={1}>
            {text1}
          </AppText>
        ) : null}
        {text2 ? (
          <AppText variant="caption" color="muted" numberOfLines={2}>
            {text2}
          </AppText>
        ) : null}
      </View>
      {props?.actionLabel && props.onAction ? (
        <Pressable hitSlop={8} onPress={props.onAction} style={styles.action}>
          <AppText variant="bodyStrong" color="primary">
            {props.actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Theme-aware toast renderers passed to <Toast config={toastConfig} />.
 * Supports an optional inline action button.
 */
export const toastConfig = {
  success: (p: ToastInternalProps) => <ToastCard kind="success" {...p} />,
  error: (p: ToastInternalProps) => <ToastCard kind="error" {...p} />,
  info: (p: ToastInternalProps) => <ToastCard kind="info" {...p} />,
};

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      width: '92%',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: t.radius.md,
      borderLeftWidth: 4,
      backgroundColor: t.colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      ...t.elevation.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: t.radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: { flex: 1 },
    action: { paddingLeft: 8 },
  });
