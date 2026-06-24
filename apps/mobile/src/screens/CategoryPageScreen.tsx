import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { useAddToCart, useCatalog } from '../api/hooks';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { AppText } from '../components/Typography';
import { money, unitLabel } from '../lib/format';
import { toast } from '../lib/toast';
import type { CatalogItem } from '../api/types';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'CategoryPage'>;

export function CategoryPageScreen({ route, navigation }: Props) {
  const { categoryId, categoryName } = route.params;
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const user = useAuthStore((s) => s.user);
  const pincode = user?.primaryPincode ?? '';
  const catalog = useCatalog(categoryId, pincode);
  const addToCart = useAddToCart();

  const onAdd = async (itemId: string) => {
    try {
      await addToCart.mutateAsync({ catalogItemId: itemId, quantity: 1 });
      toast.action({
        title: t('itemDetail.added'),
        actionLabel: t('truck.tabLabel'),
        onAction: () => navigation.navigate('Truck'),
      });
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  const items = catalog.data?.items ?? [];

  return (
    <View style={styles.container}>
      {/* Persistent RFQ entry point — must never be buried (PRD-02 §3.6). */}
      <Pressable
        style={styles.banner}
        onPress={() => navigation.navigate('PostRfq', { categoryId, categoryName })}
      >
        <AppText variant="bodyStrong" color="inverse">
          {t('categoryPage.cantFind')} {t('categoryPage.postRequirement')}
        </AppText>
        <Icon name="chevronRight" size={18} color="#ffffff" />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {catalog.isLoading ? (
          <SkeletonList rows={4} />
        ) : items.length === 0 ? (
          <EmptyState
            icon="materials"
            title={t('categoryPage.empty')}
            actionLabel={t('categoryPage.postRequirement')}
            onAction={() =>
              navigation.navigate('PostRfq', { categoryId, categoryName })
            }
          />
        ) : (
          items.map((item: CatalogItem) => (
            <Card key={item.id} style={styles.card}>
              <Pressable
                onPress={() =>
                  navigation.navigate('ItemDetail', { itemId: item.id })
                }
              >
                <AppText variant="subtitle">{item.title}</AppText>
                <AppText variant="caption" color="muted" style={styles.meta}>
                  {t('categoryPage.estimate', {
                    price: money(item.priceEstimate),
                    unit: unitLabel(item.unit),
                  })}
                </AppText>
                {item.supplier ? (
                  <AppText variant="caption" color="muted">
                    {t('categoryPage.supplier', {
                      name: item.supplier.businessName,
                    })}
                  </AppText>
                ) : null}
              </Pressable>
              <View style={styles.actions}>
                <Button
                  title={t('categoryPage.addToTruck')}
                  variant="secondary"
                  onPress={() => onAdd(item.id)}
                  style={styles.flex}
                />
                <Button
                  title={t('categoryPage.postRequirement')}
                  onPress={() =>
                    navigation.navigate('PostRfq', { categoryId, categoryName })
                  }
                  style={styles.flex}
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.colors.primary,
      paddingVertical: 13,
      paddingHorizontal: 16,
    },
    content: { padding: 16, paddingBottom: 32 },
    card: { marginBottom: 12 },
    meta: { marginTop: 4 },
    actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
    flex: { flex: 1 },
  });
