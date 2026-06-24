import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { Button } from '../components/Button';
import { AppText } from '../components/Typography';
import { toast } from '../lib/toast';
import { useInitiatePayment, usePaymentStatus } from '../api/hooks';
import { useAuthStore } from '../store/authStore';
import type { AppStackParamList } from '../navigation/types';

/**
 * Razorpay Checkout (PRD-02 §4). The native SDK (react-native-razorpay) is an
 * OPTIONAL native dependency — loaded dynamically so the app builds without it.
 * The webhook (server-side, signature-verified) is the source of truth for
 * capture; the client only polls status as a fallback.
 */
interface RazorpaySdk {
  open: (opts: Record<string, unknown>) => Promise<{ razorpay_payment_id: string }>;
}
function loadRazorpay(): RazorpaySdk | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-razorpay');
    return (mod && (mod.default ?? mod)) || null;
  } catch {
    return null;
  }
}

type Props = NativeStackScreenProps<AppStackParamList, 'Payment'>;

type Phase = 'idle' | 'opening' | 'verifying' | 'done';

export function PaymentScreen({ route }: Props) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const { orderId } = route.params;
  const user = useAuthStore((s) => s.user);
  const initiate = useInitiatePayment();
  const status = usePaymentStatus(orderId, false);
  const [phase, setPhase] = useState<Phase>('idle');

  const pay = async () => {
    setPhase('opening');
    try {
      const res = await initiate.mutateAsync(orderId);
      const Razorpay = loadRazorpay();
      if (!Razorpay) {
        toast.error(t('payment.sdkMissing'));
        setPhase('idle');
        return;
      }
      await Razorpay.open({
        key: res.key,
        order_id: res.razorpayOrderId,
        amount: res.amount,
        currency: res.currency,
        name: 'Nirmaan',
        prefill: { email: user?.email ?? '', contact: user?.phone ?? '' },
      });
      // On-device success — confirm via the webhook-backed status endpoint.
      setPhase('verifying');
      for (let i = 0; i < 5; i++) {
        const s = await status.refetch();
        if (s.data?.paymentStatus === 'CAPTURED') {
          setPhase('done');
          toast.success(t('payment.success'));
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      // Still pending — webhook may be delayed; leave on the verifying state.
    } catch {
      setPhase('idle');
      toast.error(t('payment.failed'));
    }
  };

  return (
    <View style={styles.container}>
      <AppText variant="title">{t('payment.title')}</AppText>
      <AppText variant="body" color="muted" style={styles.sub}>
        {t('payment.subtitle')}
      </AppText>

      {phase === 'verifying' ? (
        <View style={styles.center}>
          <ActivityIndicator />
          <AppText variant="caption" color="muted" style={styles.sub}>
            {t('payment.verifying')}
          </AppText>
        </View>
      ) : phase === 'done' ? (
        <AppText variant="bodyStrong">{t('payment.success')}</AppText>
      ) : (
        <Button
          title={t('payment.payNow')}
          onPress={pay}
          loading={initiate.isPending || phase === 'opening'}
        />
      )}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg, padding: 16 },
    sub: { marginVertical: 12 },
    center: { alignItems: 'center', marginTop: 24, gap: 8 },
  });
