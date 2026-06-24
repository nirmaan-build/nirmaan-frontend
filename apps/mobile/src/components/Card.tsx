import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../theme';

/**
 * Surface container. Slightly elevated/highlighted by default (soft shadow +
 * hairline border) for the "classy", layered look. Pass `flat` to drop the shadow.
 */
export function Card({
  children,
  style,
  flat,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  flat?: boolean;
}) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.card, !flat && t.elevation.card, style]}>
      {children}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.lg,
      padding: 16,
    },
  });
