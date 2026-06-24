import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LanguageToggle } from '../components/LanguageToggle';
import { AreaPickerModal } from '../components/AreaPickerModal';
import { AppText } from '../components/Typography';
import { useActiveAreas, useUpdateMe } from '../api/hooks';
import type { Area } from '../api/types';
import { ApiError } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { toast } from '../lib/toast';

export function OnboardingScreen() {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const setUser = useAuthStore((s) => s.setUser);
  const updateMe = useUpdateMe();
  const { data: areas } = useActiveAreas();

  const [name, setName] = useState('');
  const [pincode, setPincode] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState('');

  const city = areas?.find((a: Area) => a.pincode === pincode)?.city;

  const onContinue = async () => {
    if (!name.trim() || !pincode) {
      setError(t('common.fillAllFields'));
      return;
    }
    setError('');
    try {
      const updated = await updateMe.mutateAsync({
        fullName: name.trim(),
        primaryPincode: pincode,
      });
      await setUser(updated);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('common.somethingWrong');
      setError(message);
      toast.error(t('common.somethingWrong'), message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="h1" style={styles.title}>
        {t('onboarding.title')}
      </AppText>

      <Input
        label={t('onboarding.nameLabel')}
        value={name}
        onChangeText={setName}
        placeholder={t('onboarding.namePlaceholder')}
      />

      <AppText variant="caption" color="muted" style={styles.label}>
        {t('onboarding.areaLabel')}
      </AppText>
      <Pressable style={styles.areaSelect} onPress={() => setPickerOpen(true)}>
        <AppText variant="body" color={pincode ? 'text' : 'muted'}>
          {pincode
            ? `📍 ${city ?? ''} (${pincode})`
            : t('onboarding.areaPlaceholder')}
        </AppText>
      </Pressable>

      <AppText variant="caption" color="muted" style={[styles.label, styles.gap]}>
        {t('onboarding.languageLabel')}
      </AppText>
      <LanguageToggle />

      <View style={{ height: 28 }} />
      <Button
        title={updateMe.isPending ? t('onboarding.saving') : t('onboarding.continue')}
        onPress={onContinue}
        loading={updateMe.isPending}
        disabled={!name.trim() || !pincode}
      />
      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AreaPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(p) => {
          setPincode(p);
          setPickerOpen(false);
        }}
        selectedPincode={pincode ?? undefined}
      />
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 24, paddingTop: 60 },
    title: { marginBottom: 24 },
    label: { marginBottom: 6 },
    gap: { marginTop: 18 },
    areaSelect: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.md,
      paddingHorizontal: 14,
      justifyContent: 'center',
      backgroundColor: t.colors.card,
    },
    error: { marginTop: 12 },
  });
