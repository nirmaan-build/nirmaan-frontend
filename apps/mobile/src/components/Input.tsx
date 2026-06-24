import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...rest }: Props) {
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={th.colors.muted}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { marginBottom: 14 },
    label: { fontSize: t.font.xs, color: t.colors.muted, marginBottom: 6 },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.md,
      paddingHorizontal: 14,
      fontSize: t.font.md,
      color: t.colors.text,
      backgroundColor: t.colors.card,
    },
    inputError: { borderColor: t.colors.danger },
    error: { color: t.colors.danger, fontSize: t.font.xs, marginTop: 4 },
  });
