import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { AppText } from './Typography';
import { useUiStore } from '../store/uiStore';

/** Inline spinner with an optional label — drop into any loading region. */
export function Loader({
  label,
  size = 'small',
  style,
}: {
  label?: string;
  size?: 'small' | 'large';
  style?: object;
}) {
  const t = useTheme();
  return (
    <View style={[styles.inline, style]}>
      <ActivityIndicator size={size} color={t.colors.primary} />
      {label ? (
        <AppText variant="caption" color="muted" style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

/**
 * App-wide blocking overlay driven by useUiStore. Mounted once at the root.
 * Fades in/out so it never feels abrupt.
 */
export function GlobalLoader() {
  const styles = useThemedStyles(makeStyles);
  const count = useUiStore((s) => s.loadingCount);
  const label = useUiStore((s) => s.loadingLabel);
  const opacity = useRef(new Animated.Value(0)).current;
  const visible = count > 0;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="auto">
      <View style={styles.card}>
        <ActivityIndicator size="large" color={styles.spinnerColor.color} />
        {label ? (
          <AppText variant="caption" color="muted" style={{ marginTop: 10 }}>
            {label}
          </AppText>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  inline: { alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  label: { marginTop: 8 },
});

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: t.colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    },
    card: {
      minWidth: 96,
      paddingVertical: 22,
      paddingHorizontal: 26,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.bgElevated,
      alignItems: 'center',
      ...t.elevation.lg,
    },
    spinnerColor: { color: t.colors.primary },
  });
