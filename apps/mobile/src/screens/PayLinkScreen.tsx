import React, { useEffect } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { usePaymentLink } from '../api/hooks';
import { AppText } from '../components/Typography';
import { Button } from '../components/Button';
import { money } from '../lib/format';
import { toast } from '../lib/toast';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'PayLink'>;

/**
 * Deep-link target for nirmaan://pay/:paymentLinkId (Stage 13). The team sent a
 * Razorpay Payment Link; we resolve it to its hosted URL and open it. Payment is
 * confirmed server-side by the verified webhook, which creates the Order — the
 * buyer then sees it in My Orders with the normal timeline.
 */
export function PayLinkScreen({ route }: Props) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const nav = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { paymentLinkId } = route.params;
  const { data, isLoading, isError } = usePaymentLink(paymentLinkId);

  const openLink = async () => {
    if (!data?.url) return;
    try {
      await Linking.openURL(data.url);
    } catch {
      toast.error(t('payLink.openFailed'));
    }
  };

  // Auto-open the hosted page as soon as it resolves (the deep link's whole job
  // is to get the buyer to the payment page).
  useEffect(() => {
    if (data?.url && data.status !== 'PAID') void openLink();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.url]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.container}>
        <AppText variant="title">{t('payLink.title')}</AppText>
        <AppText variant="body" color="muted" style={styles.sub}>
          {t('payLink.notFound')}
        </AppText>
      </View>
    );
  }

  const paid = data.status === 'PAID';

  return (
    <View style={styles.container}>
      <AppText variant="title">{t('payLink.title')}</AppText>
      <AppText variant="display" style={styles.amount}>
        {money(data.amount)}
      </AppText>

      {paid ? (
        <>
          <AppText variant="bodyStrong">{t('payLink.alreadyPaid')}</AppText>
          <View style={{ height: 16 }} />
          <Button
            title={t('payLink.viewOrders')}
            onPress={() => nav.navigate('MyOrders')}
          />
        </>
      ) : (
        <>
          <AppText variant="body" color="muted" style={styles.sub}>
            {t('payLink.subtitle')}
          </AppText>
          <Button title={t('payLink.openButton')} onPress={openLink} />
          <View style={{ height: 12 }} />
          <Button
            title={t('payLink.viewOrders')}
            variant="secondary"
            onPress={() => nav.navigate('MyOrders')}
          />
        </>
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg, padding: 16 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    amount: { marginVertical: 12 },
    sub: { marginBottom: 16 },
  });
