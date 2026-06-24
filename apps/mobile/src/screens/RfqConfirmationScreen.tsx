import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { AppText } from '../components/Typography';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'RfqConfirmation'>;

export function RfqConfirmationScreen({ route, navigation }: Props) {
  const { status, leadCount } = route.params;
  const t = useT();
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  const user = useAuthStore((s) => s.user);
  const matched = status === 'MATCHED' && leadCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Icon
          name={matched ? 'success' : 'bell'}
          size={44}
          color={matched ? th.colors.ok : th.colors.primary}
        />
      </View>
      <AppText variant="h1" center>
        {t('postRfq.confirmTitle')}
      </AppText>
      <AppText variant="body" color="muted" center style={styles.body}>
        {t('postRfq.confirmBody', { area: user?.primaryPincode ?? '' })}
      </AppText>
      <AppText variant="bodyStrong" center style={styles.detail}>
        {matched
          ? t('postRfq.confirmMatched', { count: leadCount })
          : t('postRfq.confirmUnmatched')}
      </AppText>

      <View style={styles.actions}>
        <Button
          title={t('postRfq.viewRequirements')}
          variant="secondary"
          onPress={() => navigation.replace('MyRequirements')}
        />
        <View style={{ height: 10 }} />
        <Button
          title={t('postRfq.done')}
          onPress={() => navigation.navigate('Tabs')}
        />
      </View>
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
    iconWrap: {
      alignSelf: 'center',
      width: 88,
      height: 88,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    body: { marginTop: 10 },
    detail: { marginTop: 14 },
    actions: { marginTop: 36 },
  });
