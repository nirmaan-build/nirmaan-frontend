import React from 'react';
import { StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme, type TypographyVariant } from '../theme';

type ColorToken = 'text' | 'muted' | 'primary' | 'danger' | 'ok' | 'inverse';

interface Props extends TextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  center?: boolean;
  children: React.ReactNode;
}

/**
 * Single typographic primitive used everywhere instead of raw <Text>. Pick a
 * `variant` from the scale (display/h1/h2/title/subtitle/body/bodyStrong/
 * caption/label) and a semantic `color`. Keeps type consistent app-wide.
 */
export function AppText({
  variant = 'body',
  color = 'text',
  center,
  style,
  children,
  ...rest
}: Props) {
  const t = useTheme();
  const colorValue =
    color === 'inverse' ? t.colors.primaryText : t.colors[color];
  const base = t.typography[variant] as TextStyle;
  return (
    <Text
      style={[base, { color: colorValue }, center && styles.center, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

// Convenience wrappers for the most common roles.
export const Heading = (p: Omit<Props, 'variant'>) => (
  <AppText variant="h1" {...p} />
);
export const Title = (p: Omit<Props, 'variant'>) => (
  <AppText variant="title" {...p} />
);
export const Subtitle = (p: Omit<Props, 'variant'>) => (
  <AppText variant="subtitle" {...p} />
);
export const Body = (p: Omit<Props, 'variant'>) => (
  <AppText variant="body" {...p} />
);
export const Caption = (p: Omit<Props, 'variant'>) => (
  <AppText variant="caption" color="muted" {...p} />
);
export const Label = (p: Omit<Props, 'variant'>) => (
  <AppText variant="label" color="muted" {...p} />
);

const styles = StyleSheet.create({ center: { textAlign: 'center' } });
