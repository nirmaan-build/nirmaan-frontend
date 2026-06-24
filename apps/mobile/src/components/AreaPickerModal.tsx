import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useThemedStyles, useTheme, type Theme } from '../theme';
import { useT } from '../i18n';
import { useActiveAreas, useCheckArea } from '../api/hooks';
import { getAnonymousId } from '../lib/analytics';
import { toast } from '../lib/toast';
import type { Area } from '../api/types';
import { Input } from './Input';
import { Button } from './Button';
import { Icon } from './Icon';
import { AppText } from './Typography';
import { BottomSheet } from './BottomSheet';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (pincode: string) => void;
  selectedPincode?: string;
}

/**
 * Reusable area picker (search + active pincode list) in an animated bottom
 * sheet. Shared by onboarding, the header location selector and the RFQ flow.
 *
 * Typing a full pincode that isn't in the active list offers a "Check" action.
 * A non-serviceable result is NOT a dead-end (PRD-02 §6.2): the backend records
 * an area_interests row + area.unserved on the check, and we show a friendly
 * capture panel with a notify-me, so demand from areas we don't serve yet is
 * harvested instead of lost.
 */
export function AreaPickerModal({
  visible,
  onClose,
  onSelect,
  selectedPincode,
}: Props) {
  const t = useT();
  const th = useTheme();
  const styles = useThemedStyles(makeStyles);
  const { data: areas } = useActiveAreas();
  const checkArea = useCheckArea();
  const [q, setQ] = useState('');
  const [unserved, setUnserved] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = areas ?? [];
    if (!q.trim()) return list;
    const needle = q.trim().toLowerCase();
    return list.filter(
      (a: Area) =>
        a.pincode.includes(needle) || a.city.toLowerCase().includes(needle),
    );
  }, [areas, q]);

  const typed = q.trim();
  const isPincode = /^\d{6}$/.test(typed);
  const exactInList = (areas ?? []).some((a: Area) => a.pincode === typed);

  const reset = () => {
    setQ('');
    setUnserved(null);
  };

  const onCheck = async () => {
    try {
      const res = await checkArea.mutateAsync({
        pincode: typed,
        anonymousId: getAnonymousId(),
      });
      if (res.servicable) {
        reset();
        onSelect(typed);
      } else {
        setUnserved(typed);
      }
    } catch {
      setUnserved(typed); // treat failure as "we'll capture interest"
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={() => {
        reset();
        onClose();
      }}
      title={t('onboarding.pickArea')}
    >
      {unserved ? (
        <View style={styles.capture}>
          <AppText variant="bodyStrong">
            {t('notInArea.title', { area: unserved })}
          </AppText>
          <AppText variant="body" color="muted" style={styles.captureBody}>
            {t('notInArea.body')}
          </AppText>
          <Button
            title={t('notInArea.notifyMe')}
            onPress={() => {
              toast.success(t('notInArea.captured', { area: unserved }));
              reset();
              onClose();
            }}
          />
          <View style={{ height: 10 }} />
          <Button
            title={t('notInArea.browse')}
            variant="secondary"
            onPress={() => {
              reset();
              onClose();
            }}
          />
        </View>
      ) : (
        <>
          <Input
            value={q}
            onChangeText={setQ}
            placeholder={t('common.search')}
            autoFocus
          />
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.list}>
            {filtered.map((item: Area) => {
              const active = item.pincode === selectedPincode;
              return (
                <Pressable
                  key={item.pincode}
                  style={[styles.row, active && styles.rowActive]}
                  onPress={() => {
                    reset();
                    onSelect(item.pincode);
                  }}
                >
                  <Icon name="location" size={18} color={th.colors.primary} />
                  <View style={styles.rowBody}>
                    <AppText variant="bodyStrong">
                      {item.city}, {item.state}
                    </AppText>
                    <AppText variant="caption" color="muted">
                      {item.pincode}
                    </AppText>
                  </View>
                  {active ? (
                    <Icon name="check" size={20} color={th.colors.primary} />
                  ) : null}
                </Pressable>
              );
            })}

            {isPincode && !exactInList ? (
              <View style={styles.checkBox}>
                <Button
                  title={t('notInArea.check', { area: typed })}
                  variant="secondary"
                  loading={checkArea.isPending}
                  onPress={onCheck}
                />
              </View>
            ) : null}
          </ScrollView>
        </>
      )}
    </BottomSheet>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    list: { marginTop: 8 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: t.radius.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
    },
    rowActive: { backgroundColor: t.colors.primaryMuted },
    rowBody: { flex: 1 },
    checkBox: { marginTop: 12 },
    capture: { paddingVertical: 8 },
    captureBody: { marginTop: 6, marginBottom: 14 },
  });
