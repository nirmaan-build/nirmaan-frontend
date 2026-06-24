import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useT } from '../i18n';
import { money, unitLabel } from '../lib/format';
import { Icon } from '../components/Icon';
import { Card } from '../components/Card';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/authStore';
import { AppText } from '../components/Typography';
import { EmptyState } from '../components/EmptyState';
import { SearchTrigger } from '../components/SearchBar';
import { useCatalog, useCategories } from '../api/hooks';
import type { CatalogItem, Category } from '../api/types';
import { useSettingsStore } from '../store/settingsStore';
import { Skeleton, SkeletonList } from '../components/Skeleton';
import { useTheme, useThemedStyles, type Theme } from '../theme';

export function HomeScreen() {
  const t = useT();
  const th = useTheme();
  const nav = useNavigation<any>();
  const styles = useThemedStyles(makeStyles);
  const user = useAuthStore((s) => s.user);
  const locale = useSettingsStore((s) => s.locale);
  const pincode = user?.primaryPincode ?? '';

  const categories = useCategories(locale);
  const popular = useCatalog(undefined, pincode);

  const firstName = (user?.fullName ?? '').split(' ')[0];
  const categoryList = categories.data ?? [];
  const popularItems = popular.data?.items ?? [];

  const goSearch = () => nav.navigate('Categories');

  return (
    <View style={styles.container}>
      <Header onPressUser={() => nav.navigate('Profile')} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AppText variant="h1">
            {firstName
              ? t('home.greeting', { name: firstName })
              : t('home.greetingGuest')}
          </AppText>
          <AppText variant="body" color="muted" style={styles.tagline}>
            {t('home.tagline')}
          </AppText>
        </View>

        <SearchTrigger placeholder={t('home.searchHint')} onPress={goSearch} />

        {/* Categories — horizontal bar */}
        <View style={styles.sectionHead}>
          <AppText variant="title">{t('home.categories')}</AppText>
          <Pressable onPress={() => nav.navigate('Categories')} hitSlop={6}>
            <AppText variant="bodyStrong" color="primary">
              {t('home.viewAll')}
            </AppText>
          </Pressable>
        </View>

        {categories.isLoading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} width={96} height={96} radius={16} />
            ))}
          </ScrollView>
        ) : categoryList.length === 0 ? (
          <EmptyState compact title={t('categories.empty')} icon="categories" />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {categoryList.map((c: Category) => (
              <Pressable
                key={c.id}
                style={styles.catChip}
                onPress={() =>
                  nav.navigate('CategoryPage', {
                    categoryId: c.id,
                    categoryName: c.name,
                  })
                }
              >
                <View style={styles.catIconWrap}>
                  <Icon name="package" size={22} color={th.colors.primary} />
                </View>
                <AppText variant="caption" center numberOfLines={2}>
                  {c.name}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Popular near you */}
        <View style={styles.sectionHead}>
          <AppText variant="title">{t('home.popularNearYou')}</AppText>
        </View>

        {popular.isLoading ? (
          <SkeletonList rows={3} />
        ) : popularItems.length === 0 ? (
          <EmptyState
            icon="materials"
            title={t('home.popularEmptyTitle')}
            body={t('home.popularEmptyBody')}
            actionLabel={t('categoryPage.postRequirement')}
            onAction={() => nav.navigate('PostRfq', {})}
          />
        ) : (
          popularItems.map((item: CatalogItem) => (
            <Pressable
              key={item.id}
              onPress={() => nav.navigate('ItemDetail', { itemId: item.id })}
            >
              <Card style={styles.itemCard}>
                <View style={styles.itemThumb}>
                  <Icon name="materials" size={22} color={th.colors.primary} />
                </View>
                <View style={styles.itemBody}>
                  <AppText variant="subtitle" numberOfLines={1}>
                    {item.title}
                  </AppText>
                  <AppText variant="caption" color="muted" numberOfLines={1}>
                    {money(item.priceEstimate)} / {unitLabel(item.unit)}
                    {item.supplier ? `  ·  ${item.supplier.businessName}` : ''}
                  </AppText>
                </View>
                <Icon name="chevronRight" size={20} color={th.colors.muted} />
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    hero: { marginBottom: 16 },
    tagline: { marginTop: 4 },
    sectionHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 26,
      marginBottom: 12,
    },
    hScroll: { gap: 12, paddingRight: 4 },
    catChip: {
      width: 96,
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.lg,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      ...t.elevation.card,
    },
    catIconWrap: {
      width: 44,
      height: 44,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 10,
      paddingVertical: 12,
    },
    itemThumb: {
      width: 48,
      height: 48,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemBody: { flex: 1 },
  });
