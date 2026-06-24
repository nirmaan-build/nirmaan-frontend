import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { useSettingsStore, type Locale } from '../store/settingsStore';
import { Icon } from './Icon';
import { AppText } from './Typography';
import { BottomSheet } from './BottomSheet';
import { useT } from '../i18n';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const OPTIONS: { value: Locale; native: string }[] = [
  { value: 'en', native: 'English' },
  { value: 'hi', native: 'हिन्दी' },
];

/** Reusable language picker bottom sheet (English / हिन्दी). */
export function LanguagePickerModal({ visible, onClose }: Props) {
  const t = useT();
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  return (
    <BottomSheet visible={visible} onClose={onClose} title={t('profile.language')}>
      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const active = locale === opt.value;
          return (
            <Pressable
              key={opt.value}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => {
                setLocale(opt.value);
                onClose();
              }}
            >
              <Icon name="language" size={18} color={th.colors.primary} />
              <AppText variant="subtitle" style={styles.rowText}>
                {opt.native}
              </AppText>
              {active ? (
                <Icon name="check" size={20} color={th.colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    list: { marginTop: 4 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 12,
      borderRadius: t.radius.md,
    },
    rowActive: { backgroundColor: t.colors.primaryMuted },
    rowText: { flex: 1 },
  });
