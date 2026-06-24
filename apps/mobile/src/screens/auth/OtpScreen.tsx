import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../../theme';
import { useT } from '../../i18n';
import { useRequestOtp, useVerifyOtp } from '../../api/hooks';
import { ApiError } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore, Locale } from '../../store/settingsStore';
import { AppText } from '../../components/Typography';
import { toast } from '../../lib/toast';
import type { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Otp'>;
const LENGTH = 6;

export function OtpScreen({ route }: Props) {
  const { email } = route.params;
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(30);

  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();
  const setSession = useAuthStore((s) => s.setSession);
  const setLocale = useSettingsStore((s) => s.setLocale);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const submit = async (value: string) => {
    setError('');
    try {
      const session = await verifyOtp.mutateAsync({ email, code: value });
      const pref = session.user.preferredLocale;
      if (pref === 'en' || pref === 'hi') setLocale(pref as Locale);
      await setSession({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        user: session.user,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('auth.wrongCode'));
      setCode('');
    }
  };

  const onChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, LENGTH);
    setCode(digits);
    if (digits.length === LENGTH) void submit(digits);
  };

  const onResend = async () => {
    try {
      await requestOtp.mutateAsync(email);
      setSeconds(30);
      toast.success(t('auth.codeResent'));
    } catch {
      setError(t('common.somethingWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <AppText variant="h1">{t('auth.otpTitle')}</AppText>
      <AppText variant="body" color="muted" style={styles.subtitle}>
        {t('auth.otpSubtitle', { email })}
      </AppText>

      <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
        {Array.from({ length: LENGTH }).map((_, i) => (
          <View key={i} style={[styles.box, i === code.length && styles.boxActive]}>
            <AppText variant="h2">{code[i] ?? ''}</AppText>
          </View>
        ))}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={code}
        onChangeText={onChange}
        keyboardType="number-pad"
        maxLength={LENGTH}
        autoFocus
        style={styles.hiddenInput}
        caretHidden
      />

      {error ? (
        <AppText variant="caption" color="danger" style={styles.note}>
          {error}
        </AppText>
      ) : null}
      {verifyOtp.isPending ? (
        <AppText variant="caption" color="muted" style={styles.note}>
          {t('auth.verifying')}
        </AppText>
      ) : null}

      <View style={styles.resendRow}>
        {seconds > 0 ? (
          <AppText variant="caption" color="muted">
            {t('auth.resendIn', { seconds })}
          </AppText>
        ) : (
          <Pressable onPress={onResend}>
            <AppText variant="bodyStrong" color="primary">
              {t('auth.resend')}
            </AppText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg, padding: 24, paddingTop: 60 },
    subtitle: { marginTop: 6, marginBottom: 28 },
    boxes: { flexDirection: 'row', justifyContent: 'space-between' },
    box: {
      width: 48,
      height: 56,
      borderRadius: t.radius.md,
      borderWidth: 1,
      borderColor: t.colors.border,
      backgroundColor: t.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boxActive: { borderColor: t.colors.primary, borderWidth: 2 },
    hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
    note: { marginTop: 16 },
    resendRow: { marginTop: 24 },
  });
