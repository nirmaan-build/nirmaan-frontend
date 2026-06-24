import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import {
  useCategories,
  useCreateRfq,
  useUnits,
  useRequestUnit,
  type UnitOption,
} from '../api/hooks';
import type { Category } from '../api/types';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AppText } from '../components/Typography';
import { Icon } from '../components/Icon';
import { BottomSheet } from '../components/BottomSheet';
import { AreaPickerModal } from '../components/AreaPickerModal';
import { ApiError } from '../api/client';
import { toast } from '../lib/toast';
import type { AppStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<AppStackParamList, 'PostRfq'>;

export function PostRfqScreen({ route, navigation }: Props) {
  const t = useT();
  const styles = useThemedStyles(makeStyles);
  const user = useAuthStore((s) => s.user);
  const locale = useSettingsStore((s) => s.locale);
  const categories = useCategories(locale);
  const units = useUnits(locale);
  const requestUnit = useRequestUnit();
  const createRfq = useCreateRfq();

  const [categoryId, setCategoryId] = useState(route.params?.categoryId ?? '');
  const [categoryName, setCategoryName] = useState(
    route.params?.categoryName ?? '',
  );
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitId, setUnitId] = useState('');
  const [unitName, setUnitName] = useState('');
  const [pincode, setPincode] = useState(user?.primaryPincode ?? '');
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const [newUnitText, setNewUnitText] = useState('');
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    categoryId &&
    description.trim() &&
    Number(quantity) > 0 &&
    unitId &&
    pincode;

  const onSubmit = async () => {
    if (!canSubmit) {
      setError(t('common.fillAllFields'));
      return;
    }
    setError('');
    try {
      const rfq = await createRfq.mutateAsync({
        categoryId,
        pincode,
        description: description.trim(),
        quantity: Number(quantity),
        unitId,
      });
      navigation.replace('RfqConfirmation', {
        rfqId: rfq.id,
        status: rfq.status,
        leadCount: rfq.leads?.length ?? 0,
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t('common.somethingWrong');
      setError(message);
      toast.error(t('common.somethingWrong'), message);
    }
  };

  // Requesting a new unit NEVER blocks the form (PRD-02 §3.8.1): it just logs
  // the ask; the buyer still picks the closest existing unit to continue.
  const onRequestUnit = async () => {
    const raw = newUnitText.trim();
    if (!raw) return;
    try {
      await requestUnit.mutateAsync({ rawText: raw, context: 'rfq' });
    } catch {
      // swallow — a failed request must not block picking a unit.
    }
    setNewUnitText('');
    toast.success(t('units.requested'));
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="label" color="muted" style={styles.label}>
        {t('postRfq.categoryLabel')}
      </AppText>
      <Pressable style={styles.select} onPress={() => setCatPickerOpen(true)}>
        <AppText variant="body" color={categoryName ? 'text' : 'muted'}>
          {categoryName || t('postRfq.categoryPlaceholder')}
        </AppText>
        <Icon name="chevronDown" size={18} color={styles.chevron.color} />
      </Pressable>

      <View style={{ height: 14 }} />
      <Input
        label={t('postRfq.descriptionLabel')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('postRfq.descriptionPlaceholder')}
        multiline
        numberOfLines={3}
        style={styles.multiline}
      />

      <View style={styles.row}>
        <View style={styles.flex}>
          <Input
            label={t('postRfq.quantityLabel')}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="numeric"
            placeholder="0"
          />
        </View>
        <View style={styles.flex}>
          <AppText variant="label" color="muted" style={styles.label}>
            {t('postRfq.unitLabel')}
          </AppText>
          <Pressable
            style={styles.select}
            onPress={() => setUnitPickerOpen(true)}
          >
            <AppText variant="body" color={unitName ? 'text' : 'muted'}>
              {unitName || t('postRfq.unitPlaceholder')}
            </AppText>
            <Icon name="chevronDown" size={18} color={styles.chevron.color} />
          </Pressable>
        </View>
      </View>

      <AppText variant="label" color="muted" style={styles.label}>
        {t('postRfq.areaLabel')}
      </AppText>
      <Pressable style={styles.select} onPress={() => setAreaPickerOpen(true)}>
        <AppText variant="body">📍 {pincode}</AppText>
      </Pressable>

      <View style={{ height: 24 }} />
      <Button
        title={createRfq.isPending ? t('postRfq.submitting') : t('postRfq.submit')}
        onPress={onSubmit}
        loading={createRfq.isPending}
        disabled={!canSubmit}
      />
      {error ? (
        <AppText variant="caption" color="danger" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <BottomSheet
        visible={catPickerOpen}
        onClose={() => setCatPickerOpen(false)}
        title={t('postRfq.categoryLabel')}
      >
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.sheetList}>
          {(categories.data ?? []).map((item: Category) => (
            <Pressable
              key={item.id}
              style={styles.sheetRow}
              onPress={() => {
                setCategoryId(item.id);
                setCategoryName(item.name);
                setCatPickerOpen(false);
              }}
            >
              <Icon name="package" size={18} color={styles.chevron.color} />
              <AppText variant="subtitle" style={styles.flex}>
                {item.name}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheet>

      <BottomSheet
        visible={unitPickerOpen}
        onClose={() => setUnitPickerOpen(false)}
        title={t('units.pickerTitle')}
      >
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.sheetList}>
          {(units.data ?? []).map((item: UnitOption) => (
            <Pressable
              key={item.id}
              style={styles.sheetRow}
              onPress={() => {
                setUnitId(item.id);
                setUnitName(item.name);
                setUnitPickerOpen(false);
              }}
            >
              <AppText variant="subtitle" style={styles.flex}>
                {item.name}
              </AppText>
            </Pressable>
          ))}

          {/* Request a new unit — informational only, never blocks (§3.8.1). */}
          <View style={styles.requestBox}>
            <AppText variant="label" color="muted" style={styles.label}>
              {t('units.requestNew')}
            </AppText>
            <Input
              value={newUnitText}
              onChangeText={setNewUnitText}
              placeholder={t('units.requestPlaceholder')}
            />
            <View style={{ height: 10 }} />
            <Button
              title={t('units.requestCta')}
              variant="secondary"
              onPress={onRequestUnit}
              loading={requestUnit.isPending}
              disabled={!newUnitText.trim()}
            />
          </View>
        </ScrollView>
      </BottomSheet>

      <AreaPickerModal
        visible={areaPickerOpen}
        onClose={() => setAreaPickerOpen(false)}
        onSelect={(p) => {
          setPincode(p);
          setAreaPickerOpen(false);
        }}
        selectedPincode={pincode}
      />
    </ScrollView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    content: { padding: 16, paddingBottom: 40 },
    label: { marginBottom: 6 },
    select: {
      minHeight: 50,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: t.colors.card,
    },
    chevron: { color: t.colors.muted },
    multiline: { height: 90, textAlignVertical: 'top', paddingTop: 10 },
    row: { flexDirection: 'row', gap: 12 },
    flex: { flex: 1 },
    error: { marginTop: 12 },
    sheetList: { marginTop: 4 },
    sheetRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: t.radius.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
    },
    requestBox: {
      marginTop: 12,
      paddingTop: 14,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
  });
