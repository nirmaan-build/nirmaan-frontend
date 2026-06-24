import React, { useState } from 'react';
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import {
  useOrderTimeline,
  useAdvanceOrder,
  useRaiseDispute,
  type OrderStatusEventRow,
} from '../api/hooks';
import { AppText } from '../components/Typography';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { toast } from '../lib/toast';
import type { AppStackParamList } from '../navigation/types';

// Supplier-advance path (PRD-00 §3.8); server re-validates the transition.
const NEXT: Record<string, string | undefined> = {
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'DISPATCHED',
  DISPATCHED: 'DELIVERED',
};

type Props = NativeStackScreenProps<AppStackParamList, 'OrderTracking'>;

export function OrderTrackingScreen({ route }: Props) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const { orderId } = route.params;
  const { data, isLoading, refetch, isRefetching } = useOrderTimeline(orderId);
  const advance = useAdvanceOrder();
  const raise = useRaiseDispute();
  const [note, setNote] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');

  const next = data ? NEXT[data.status] : undefined;
  const dispatchedOrLater =
    data?.status === 'DISPATCHED' || data?.status === 'DELIVERED';

  const onAdvance = async () => {
    if (!next) return;
    try {
      await advance.mutateAsync({
        orderId,
        status: next,
        note: next === 'DISPATCHED' ? note.trim() || undefined : undefined,
      });
      setNote('');
      toast.success(t('tracking.advanced', { status: t(`orderStatus.${next}`) }));
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  const onRaise = async () => {
    if (!reason.trim()) return;
    try {
      await raise.mutateAsync({
        orderId,
        reason: reason.trim(),
        description: desc.trim() || undefined,
      });
      setReason('');
      setDesc('');
      setIssueOpen(false);
      toast.success(t('dispute.followUp'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.somethingWrong'));
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
      }
    >
      {isLoading || !data ? (
        <AppText variant="body" color="muted">
          {t('common.loading')}
        </AppText>
      ) : (
        <>
          <AppText variant="title">{data.supplierName}</AppText>
          <AppText variant="caption" color="muted" style={styles.amount}>
            ₹{Number(data.totalAmount).toLocaleString('en-IN')}
          </AppText>

          <View style={styles.timeline}>
            {data.events.length === 0 ? (
              <AppText variant="body" color="muted">
                {t('tracking.empty')}
              </AppText>
            ) : (
              data.events.map((e: OrderStatusEventRow) => (
                <View key={e.id} style={styles.event}>
                  <View style={styles.dot} />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong">
                      {t(`orderStatus.${e.status}`)}
                    </AppText>
                    <AppText variant="caption" color="muted">
                      {new Date(e.occurredAt).toLocaleString()}
                    </AppText>
                    {e.note ? <AppText variant="caption">{e.note}</AppText> : null}
                  </View>
                </View>
              ))
            )}
          </View>

          {data.isSupplier && next ? (
            <View style={styles.actions}>
              {next === 'DISPATCHED' ? (
                <Input
                  value={note}
                  onChangeText={setNote}
                  placeholder={t('tracking.notePlaceholder')}
                />
              ) : null}
              <View style={{ height: 10 }} />
              <Button
                title={t('tracking.advanceTo', {
                  status: t(`orderStatus.${next}`),
                })}
                onPress={onAdvance}
                loading={advance.isPending}
              />
            </View>
          ) : null}

          {!data.isSupplier && dispatchedOrLater ? (
            <View style={styles.actions}>
              {data.supplierPhone ? (
                <Button
                  title={t('tracking.callSupplier')}
                  variant="secondary"
                  onPress={() => Linking.openURL(`tel:${data.supplierPhone}`)}
                />
              ) : (
                <AppText variant="caption" color="muted">
                  {t('tracking.noPhone')}
                </AppText>
              )}
            </View>
          ) : null}

          {!data.isSupplier ? (
            <View style={styles.actions}>
              {issueOpen ? (
                <>
                  <Input
                    value={reason}
                    onChangeText={setReason}
                    placeholder={t('dispute.reasonPlaceholder')}
                  />
                  <View style={{ height: 8 }} />
                  <Input
                    value={desc}
                    onChangeText={setDesc}
                    placeholder={t('dispute.description')}
                    multiline
                  />
                  <View style={{ height: 10 }} />
                  <Button
                    title={t('dispute.submit')}
                    onPress={onRaise}
                    loading={raise.isPending}
                    disabled={!reason.trim()}
                  />
                </>
              ) : (
                <Button
                  title={t('dispute.raise')}
                  variant="secondary"
                  onPress={() => setIssueOpen(true)}
                />
              )}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    amount: { marginTop: 4, marginBottom: 16 },
    timeline: { gap: 14 },
    event: { flexDirection: 'row', gap: 12 },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: t.colors.primary,
      marginTop: 5,
    },
    flex: { flex: 1 },
    actions: { marginTop: 20 },
  });
