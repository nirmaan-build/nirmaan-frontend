import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme';
import { useSettingsStore, Locale } from '../store/settingsStore';

const OPTIONS: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
];

/** One-tap EN/HI language toggle (PRD-00 §3.3, PRD-02 §3.2). */
export function LanguageToggle() {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = locale === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => setLocale(opt.value)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {opt.label}
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
      borderRadius: t.radius.pill,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.card,
    },
    pillActive: {
      backgroundColor: t.colors.primary,
      borderColor: t.colors.primary,
    },
    text: { color: t.colors.text, fontSize: t.font.sm, fontWeight: '600' },
    textActive: { color: t.colors.primaryText },
  });
