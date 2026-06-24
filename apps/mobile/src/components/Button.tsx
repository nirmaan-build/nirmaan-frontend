import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: Props) {
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? th.colors.primaryText : th.colors.primary}
        />
      ) : (
        <Text style={isPrimary ? styles.primaryText : styles.secondaryText}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    base: {
      height: 50,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    primary: { backgroundColor: t.colors.primary },
    secondary: {
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
    },
    disabled: { opacity: 0.5 },
    pressed: { opacity: 0.85 },
    primaryText: {
      color: t.colors.primaryText,
      fontSize: t.font.md,
      fontWeight: '700',
    },
    secondaryText: {
      color: t.colors.text,
      fontSize: t.font.md,
      fontWeight: '600',
    },
  });
