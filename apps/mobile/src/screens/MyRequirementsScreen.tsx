import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useMyRfqs } from '../api/hooks';
import { Card } from '../components/Card';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { AppText } from '../components/Typography';
import type { Rfq } from '../api/types';

export function MyRequirementsScreen() {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const { data, isLoading } = useMyRfqs();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isLoading ? (
        <SkeletonList rows={4} />
      ) : (data?.length ?? 0) === 0 ? (
        <EmptyState
          icon="requirements"
          title={t('requirements.empty')}
          style={styles.empty}
        />
      ) : (
        (data ?? []).map((rfq: Rfq) => {
          const leadCount = rfq._count?.leads ?? rfq.leads?.length ?? 0;
          return (
            <Card key={rfq.id} style={styles.card}>
              <View style={styles.rowTop}>
                <AppText variant="subtitle" numberOfLines={1} style={styles.desc}>
                  {rfq.description}
                </AppText>
                <View style={styles.statusPill}>
                  <AppText variant="label" color="primary">
                    {t(`rfqStatus.${rfq.status}`)}
                  </AppText>
                </View>
              </View>
              <AppText variant="caption" color="muted" style={styles.meta}>
                {t('requirements.quantity', {
                  quantity: String(rfq.quantity),
                  unit: rfq.unit,
                })}
              </AppText>
              <AppText variant="body" style={styles.leads}>
                {t('requirements.leads', { count: leadCount })}
              </AppText>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 32 },
    empty: { marginTop: 40 },
    card: { marginBottom: 12 },
    rowTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    desc: { flex: 1 },
    statusPill: {
      backgroundColor: t.colors.primaryMuted,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: t.radius.pill,
    },
    meta: { marginTop: 6 },
    leads: { marginTop: 6 },
  });
