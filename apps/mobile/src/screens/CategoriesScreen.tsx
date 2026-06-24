import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useCategories } from '../api/hooks';
import { Header } from '../components/Header';
import { SearchBar } from '../components/SearchBar';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { AppText } from '../components/Typography';
import { Category, Suggestion } from '../api/types';

// PRD-02 §3.5: Categories tab is search-first — a search bar on top, the full
// category grid below for browsing without typing. This is also where Home's
// search field lands the user (per user spec).
export function CategoriesScreen() {
  const t = useT();
  const nav = useNavigation<any>();
  const styles = useThemedStyles(makeStyles);
  const user = useAuthStore((s) => s.user);
  const locale = useSettingsStore((s) => s.locale);
  const th = useTheme();
  const pincode = user?.primaryPincode ?? '';
  const categories = useCategories(locale);

  const onPick = (s: Suggestion) => {
    if (s.type === 'category') {
      nav.navigate('CategoryPage', { categoryId: s.id, categoryName: s.label });
    } else {
      nav.navigate('ItemDetail', { itemId: s.id });
    }
  };

  return (
    <View style={styles.container}>
      <Header onPressUser={() => nav.navigate('Profile')} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SearchBar
          pincode={pincode}
          locale={locale}
          placeholder={t('categories.searchPlaceholder')}
          onPick={onPick}
        />
        <AppText variant="title" style={styles.section}>
          {t('categories.browseAll')}
        </AppText>
        {categories.isLoading ? (
          <SkeletonList rows={4} />
        ) : (categories.data?.length ?? 0) === 0 ? (
          <EmptyState icon="categories" title={t('categories.empty')} />
        ) : (
          <View style={styles.grid}>
            {(categories.data ?? []).map((c: Category) => (
              <Pressable
                key={c.id}
                style={styles.chip}
                onPress={() =>
                  nav.navigate('CategoryPage', {
                    categoryId: c.id,
                    categoryName: c.name,
                  })
                }
              >
                <View style={styles.chipIconWrap}>
                  <Icon name="package" size={22} color={th.colors.primary} />
                </View>
                <AppText variant="caption" center numberOfLines={2}>
                  {c.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    section: { marginTop: 24, marginBottom: 14 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    chip: {
      width: '30.5%',
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.lg,
      paddingVertical: 16,
      paddingHorizontal: 6,
      alignItems: 'center',
      ...t.elevation.card,
    },
    chipIconWrap: {
      width: 44,
      height: 44,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
  });
