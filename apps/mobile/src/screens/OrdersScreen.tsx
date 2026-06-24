import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMyOrders, type OrderListItem } from '../api/hooks';
import { AppText } from '../components/Typography';
import { Button } from '../components/Button';
import type { AppStackParamList } from '../navigation/types';

/**
 * My Orders (PRD-02 §3.11) — list view only. Buyer/supplier toggle lets a user
 * who is both see each side. The full tracking timeline arrives in Stage 10.
 */
export function OrdersScreen() {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const nav = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [role, setRole] = useState<'buyer' | 'supplier'>('buyer');
  const { data: orders, isLoading } = useMyOrders(role);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.toggle}>
        <Pressable
          style={[styles.toggleBtn, role === 'buyer' && styles.toggleActive]}
          onPress={() => setRole('buyer')}
        >
          <AppText variant="bodyStrong" color={role === 'buyer' ? 'text' : 'muted'}>
            {t('orders.asBuyer')}
          </AppText>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, role === 'supplier' && styles.toggleActive]}
          onPress={() => setRole('supplier')}
        >
          <AppText
            variant="bodyStrong"
            color={role === 'supplier' ? 'text' : 'muted'}
          >
            {t('orders.asSupplier')}
          </AppText>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : (orders?.length ?? 0) === 0 ? (
        <AppText variant="body" color="muted" style={styles.empty}>
          {t('orders.empty')}
        </AppText>
      ) : (
        (orders ?? []).map((o: OrderListItem) => (
          <Pressable
            key={o.id}
            style={styles.card}
            onPress={() => nav.navigate('OrderTracking', { orderId: o.id })}
          >
            <View style={styles.cardHead}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {role === 'supplier'
                  ? o.buyer?.fullName ?? '—'
                  : o.supplier?.businessName ?? '—'}
              </AppText>
              <AppText variant="caption">{t(`orderStatus.${o.status}`)}</AppText>
            </View>
            <AppText variant="subtitle">
              ₹{Number(o.totalAmount).toLocaleString('en-IN')}
            </AppText>
            <AppText variant="caption" color="muted">
              {t('orders.placedOn', {
                date: new Date(o.placedAt).toLocaleDateString(),
              })}
            </AppText>
            {role === 'buyer' && o.status === 'PLACED' ? (
              <View style={{ marginTop: 8 }}>
                <Button
                  title={t('orders.payNow')}
                  onPress={() => nav.navigate('Payment', { orderId: o.id })}
                />
              </View>
            ) : null}
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    toggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    toggleBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.card,
    },
    toggleActive: {
      borderColor: t.colors.primary,
      backgroundColor: t.colors.primaryMuted,
    },
    empty: { textAlign: 'center', marginTop: 40 },
    card: {
      backgroundColor: t.colors.card,
      borderRadius: t.radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.colors.border,
      padding: 14,
      marginBottom: 10,
      gap: 4,
    },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    flex: { flex: 1 },
  });
