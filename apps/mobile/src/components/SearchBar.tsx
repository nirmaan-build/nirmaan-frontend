import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useSuggest } from '../api/hooks';
import { Suggestion } from '../api/types';
import { Input } from './Input';
import { Icon } from './Icon';
import { AppText } from './Typography';

interface Props {
  pincode: string;
  locale: string;
  placeholder?: string;
  onPick: (s: Suggestion) => void;
  autoFocus?: boolean;
}

/** Search bar with autosuggest (PRD-02 §3.4/§3.5). */
export function SearchBar({
  pincode,
  locale,
  placeholder,
  onPick,
  autoFocus,
}: Props) {
  const t = useT();
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const { data } = useSuggest(q, pincode, locale);

  const suggestions = data?.suggestions ?? [];

  return (
    <View>
      <View style={styles.field}>
        <View style={styles.leadIcon}>
          <Icon name="search" size={18} color={th.colors.muted} />
        </View>
        <Input
          value={q}
          onChangeText={setQ}
          onFocus={() => setFocused(true)}
          placeholder={placeholder ?? t('common.search')}
          autoFocus={autoFocus}
          style={styles.input}
        />
      </View>
      {focused && suggestions.length > 0 ? (
        <View style={styles.dropdown}>
          {suggestions.map((s: Suggestion) => (
            <Pressable
              key={`${s.type}-${s.id}`}
              style={styles.row}
              onPress={() => {
                setFocused(false);
                onPick(s);
              }}
            >
              <Icon
                name={s.type === 'category' ? 'package' : 'search'}
                size={16}
                color={th.colors.muted}
              />
              <AppText variant="body" numberOfLines={1} style={styles.label}>
                {s.label}
              </AppText>
              {s.supplierCount !== undefined ? (
                <AppText variant="caption" color="muted">
                  {String(s.supplierCount)}
                </AppText>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** Non-editable search field that navigates to the search-first Categories screen. */
export function SearchTrigger({
  placeholder,
  onPress,
}: {
  placeholder?: string;
  onPress: () => void;
}) {
  const t = useT();
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.9 }]}
      onPress={onPress}
    >
      <Icon name="search" size={18} color={th.colors.muted} />
      <AppText variant="body" color="muted" numberOfLines={1} style={styles.triggerText}>
        {placeholder ?? t('common.search')}
      </AppText>
    </Pressable>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    field: { position: 'relative', justifyContent: 'center' },
    leadIcon: { position: 'absolute', left: 14, zIndex: 1 },
    input: { marginBottom: 0, paddingLeft: 42 },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 50,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.card,
      paddingHorizontal: 14,
      ...t.elevation.sm,
    },
    triggerText: { flex: 1 },
    dropdown: {
      marginTop: 8,
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.md,
      overflow: 'hidden',
      ...t.elevation.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
    },
    label: { flex: 1 },
  });
