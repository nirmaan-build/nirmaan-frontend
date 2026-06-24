import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useAddToCart, useCatalogItem } from '../api/hooks';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { SkeletonList } from '../components/Skeleton';
import { AppText } from '../components/Typography';
import { money, unitLabel } from '../lib/format';
import { toast } from '../lib/toast';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'ItemDetail'>;

export function ItemDetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const { data: item, isLoading } = useCatalogItem(itemId);
  const addToCart = useAddToCart();

  const onAdd = async () => {
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

  if (isLoading || !item) {
    return (
      <View style={styles.container}>
        <View style={styles.pad}>
          <SkeletonList rows={3} />
        </View>
      </View>
    );
  }

  const category = (item as any).category as
    | { id: string; name: string }
    | undefined;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="h2" style={styles.title}>
        {item.title}
      </AppText>

      <Card>
        <AppText variant="caption" color="muted">
          {t('itemDetail.estimate')}
        </AppText>
        <AppText variant="h2" style={styles.price}>
          {money(item.priceEstimate)} / {unitLabel(item.unit)}
        </AppText>
        {item.supplier ? (
          <>
            <AppText variant="caption" color="muted" style={styles.supplierLabel}>
              {t('itemDetail.supplier')}
            </AppText>
            <AppText variant="subtitle">{item.supplier.businessName}</AppText>
          </>
        ) : null}
      </Card>

      <View style={{ height: 16 }} />
      <Button title={t('itemDetail.addToTruck')} variant="secondary" onPress={onAdd} />
      <View style={{ height: 10 }} />
      <Button
        title={t('itemDetail.postRequirement')}
        onPress={() =>
          navigation.navigate('PostRfq', {
            categoryId: category?.id,
            categoryName: category?.name,
          })
        }
      />
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    pad: { padding: 16 },
    title: { marginBottom: 16 },
    price: { marginTop: 4 },
    supplierLabel: { marginTop: 12 },
  });
