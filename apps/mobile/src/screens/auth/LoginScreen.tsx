import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../../theme';
import { useT } from '../../i18n';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AppText } from '../../components/Typography';
import { useRequestOtp } from '../../api/hooks';
import { ApiError } from '../../api/client';
import { toast } from '../../lib/toast';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginScreen({ navigation }: Props) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const requestOtp = useRequestOtp();

  const onSendCode = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('auth.invalidEmail'));
      return;
    }
    setError('');
    try {
      await requestOtp.mutateAsync(email.trim());
      navigation.navigate('Otp', { email: email.trim() });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.somethingWrong'));
    }
  };

  // Google sign-in needs the native @react-native-google-signin SDK; surfaced
  // here but stubbed until a Google client ID + native config exist (flagged).
  const onGoogle = () => toast.info(t('common.appName'), t('auth.googleDevBuild'));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.logoBadge}>
          <AppText variant="h1" style={styles.logoText}>
            {t('common.appName').charAt(0)}
          </AppText>
        </View>
        <AppText variant="h1">{t('auth.title')}</AppText>
        <AppText variant="body" color="muted" style={styles.subtitle}>
          {t('auth.subtitle')}
        </AppText>

        <Input
          label={t('auth.emailLabel')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.emailPlaceholder')}
          autoCapitalize="none"
          keyboardType="email-address"
          error={error || undefined}
        />
        <Button
          title={requestOtp.isPending ? t('auth.sending') : t('auth.sendCode')}
          onPress={onSendCode}
          loading={requestOtp.isPending}
        />

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <AppText variant="caption" color="muted" style={styles.or}>
            {t('auth.or')}
          </AppText>
          <View style={styles.line} />
        </View>

        <Button
          title={t('auth.continueGoogle')}
          variant="secondary"
          onPress={onGoogle}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    inner: { flex: 1, justifyContent: 'center', padding: 24 },
    logoBadge: {
      width: 64,
      height: 64,
      borderRadius: t.radius.lg,
      backgroundColor: t.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    logoText: { color: '#ffffff' },
    subtitle: { marginTop: 6, marginBottom: 24 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
    line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border },
    or: { marginHorizontal: 12 },
  });
