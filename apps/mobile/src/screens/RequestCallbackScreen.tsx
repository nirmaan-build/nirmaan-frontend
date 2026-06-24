import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useRequestCallback } from '../api/hooks';
import { useAuthStore } from '../store/authStore';
import { AppText } from '../components/Typography';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { toast } from '../lib/toast';
import type { AppStackParamList } from '../navigation/types';

/**
 * "Request a Callback" (PRD-02 §3.9–3.10). Framing is deliberate: this is
 * "talk to us first" — the team will call to help finalise the order. It is NOT
 * a fallback for a failed checkout, and the copy never implies that.
 */
export function RequestCallbackScreen() {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const nav = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const user = useAuthStore((s) => s.user);
  const requestCallback = useRequestCallback();

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [note, setNote] = useState('');

  const submit = async () => {
    try {
      const res = await requestCallback.mutateAsync({
        preferredPhone: phone.trim(),
        note: note.trim() || undefined,
      });
      nav.replace('CallbackConfirmation', { callbackId: res.id });
    } catch {
      toast.error(t('callback.error'));
    }
  };

  const phoneValid = /^(\+91|0)?[6-9]\d{9}$/.test(phone.trim());

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppText variant="title">{t('callback.title')}</AppText>
      <AppText variant="body" color="muted" style={styles.lede}>
        {t('callback.lede')}
      </AppText>

      <AppText variant="label" style={styles.label}>
        {t('callback.phoneLabel')}
      </AppText>
      <Input
        value={phone}
        onChangeText={setPhone}
        placeholder={t('callback.phonePlaceholder')}
        keyboardType="phone-pad"
      />

      <AppText variant="label" style={styles.label}>
        {t('callback.noteLabel')}
      </AppText>
      <Input
        value={note}
        onChangeText={setNote}
        placeholder={t('callback.notePlaceholder')}
        multiline
      />

      <View style={{ height: 20 }} />
      <Button
        title={t('callback.submit')}
        onPress={submit}
        loading={requestCallback.isPending}
        disabled={!phoneValid}
      />
      <AppText variant="caption" color="muted" style={styles.reassure}>
        {t('callback.reassure')}
      </AppText>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    lede: { marginTop: 8, marginBottom: 8 },
    label: { marginTop: 16, marginBottom: 6 },
    reassure: { marginTop: 14, textAlign: 'center' },
  });
