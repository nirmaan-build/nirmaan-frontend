import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useSettingsStore, type ThemeMode } from '../store/settingsStore';

const OPTIONS: { value: ThemeMode; icon: string; labelKey: string }[] = [
  { value: 'light', icon: '☀️', labelKey: 'theme.light' },
  { value: 'dark', icon: '🌙', labelKey: 'theme.dark' },
  { value: 'system', icon: '🌗', labelKey: 'theme.system' },
];

/** Light / Dark / System appearance control (default: System → follows OS). */
export function ThemeToggle() {
  const t = useT();
  const mode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = mode === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setThemeMode(opt.value)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={styles.icon}>{opt.icon}</Text>
            <Text style={[styles.text, active && styles.textActive]}>
              {t(opt.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 8 },
    pill: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.card,
    },
    pillActive: {
      backgroundColor: t.colors.primaryMuted,
      borderColor: t.colors.primary,
    },
    icon: { fontSize: 18, marginBottom: 4 },
    text: { color: t.colors.muted, fontSize: t.font.xs, fontWeight: '600' },
    textActive: { color: t.colors.primary },
  });
