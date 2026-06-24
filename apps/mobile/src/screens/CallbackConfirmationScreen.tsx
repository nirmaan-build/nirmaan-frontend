import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemedStyles, useTheme, type Theme } from '../theme';
import { useT } from '../i18n';
import { AppText } from '../components/Typography';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import type { AppStackParamList } from '../navigation/types';

/**
 * Callback confirmation (PRD-02 §3.10). Reaffirms the "we'll call you" promise
 * with an honest response-time expectation (same business day, next at the
 * latest). No "payment failed / try again" language anywhere.
 */
export function CallbackConfirmationScreen() {
  const t = useT();
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  const nav = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Icon name="success" size={48} color={th.colors.primary} />
      </View>
      <AppText variant="title" style={styles.center}>
        {t('callback.confirmTitle')}
      </AppText>
      <AppText variant="body" color="muted" style={styles.body}>
        {t('callback.confirmBody')}
      </AppText>
      <View style={styles.sla}>
        <Icon name="bell" size={18} color={th.colors.primary} />
        <AppText variant="bodyStrong" style={styles.slaText}>
          {t('callback.responseTime')}
        </AppText>
      </View>

      <View style={{ height: 28 }} />
      <Button
        title={t('callback.backToTruck')}
        onPress={() => nav.navigate('Truck')}
      />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: t.colors.bg,
      padding: 24,
      justifyContent: 'center',
    },
    badge: { alignItems: 'center', marginBottom: 20 },
    center: { textAlign: 'center' },
    body: { textAlign: 'center', marginTop: 12 },
    sla: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 20,
      backgroundColor: t.colors.primaryMuted,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: t.radius.md,
    },
    slaText: { flexShrink: 1 },
  });
