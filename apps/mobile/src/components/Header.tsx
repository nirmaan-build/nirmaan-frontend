import {useT} from '../i18n';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useAuthStore} from '../store/authStore';
import {useTheme, useThemedStyles, type Theme} from '../theme';
import {
  useActiveAreas,
  useUpdateArea,
  useUnreadCount,
  useCart,
} from '../api/hooks';
import type {Area} from '../api/types';
import type {AppStackParamList} from '../navigation/types';
import {AreaPickerModal} from './AreaPickerModal';
import {Icon} from './Icon';
import {TruckIcon} from './TruckIcon';
import {AppText} from './Typography';
import {toast} from '../lib/toast';

export function Header({
  onPressUser,
  onBack,
  showTruck = true,
}: {
  onPressUser?: () => void;
  /** When provided, the left slot shows a back arrow instead of the avatar. */
  onBack?: () => void;
  /** Hide the My Truck button (e.g. on the Truck screen itself). */
  showTruck?: boolean;
}) {
  const t = useT();
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const {data: areas} = useActiveAreas();
  const updateArea = useUpdateArea();
  const {data: unread} = useUnreadCount();
  const {data: cart} = useCart();
  const nav = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [pickerOpen, setPickerOpen] = useState(false);
  const unreadCount = unread?.count ?? 0;
  const cartCount = cart?.total_item_count ?? 0;

  const city =
    areas?.find((a: Area) => a.pincode === user?.primaryPincode)?.city ??
    user?.primaryPincode ??
    '—';

  const onSelect = async (pincode: string) => {
    setPickerOpen(false);
    try {
      const updated = await updateArea.mutateAsync(pincode);
      await setUser(updated);
      const newCity =
        areas?.find((a: Area) => a.pincode === pincode)?.city ?? pincode;
      toast.success(t('header.areaUpdated'), newCity);
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  const initial = (user?.fullName ?? '').trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.bar, {paddingTop: insets.top + 10}]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityLabel={t('common.back')}>
          <Icon name="back" size={24} color={th.colors.text} />
        </Pressable>
      ) : (
        <Pressable
          onPress={onPressUser}
          style={styles.avatar}
          hitSlop={8}
          accessibilityLabel={t('profile.title')}>
          {initial ? (
            <AppText variant="subtitle" color="primary">
              {initial}
            </AppText>
          ) : (
            <Icon name="user" size={20} color={th.colors.primary} />
          )}
        </Pressable>
      )}

      <View style={styles.brandBlock}>
        <AppText variant="title">{t('common.appName')}</AppText>
        <Pressable
          style={styles.locationRow}
          onPress={() => setPickerOpen(true)}
          hitSlop={6}>
          <Icon name="location" size={14} color={th.colors.muted} />
          <AppText
            variant="caption"
            color="muted"
            numberOfLines={1}
            style={styles.city}>
            {city}
          </AppText>
          <Icon name="chevronDown" size={14} color={th.colors.muted} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => nav.navigate('Notifications')}
        style={styles.iconBtn}
        hitSlop={8}
        accessibilityLabel={t('notifications.title')}>
        <Icon name="bell" size={22} color={th.colors.text} />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <AppText variant="label" style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : String(unreadCount)}
            </AppText>
          </View>
        ) : null}
      </Pressable>

      {showTruck ? (
        <Pressable
          onPress={() => nav.navigate('Truck')}
          style={styles.iconBtn}
          hitSlop={8}
          accessibilityLabel={t('truck.tabLabel')}>
          <TruckIcon count={cartCount} size={22} color={th.colors.text} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <AppText variant="label" style={styles.badgeText}>
                {cartCount > 9 ? '9+' : String(cartCount)}
              </AppText>
            </View>
          ) : null}
        </Pressable>
      ) : null}

      <AreaPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={onSelect}
        selectedPincode={user?.primaryPincode ?? undefined}
      />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 12,
      backgroundColor: t.colors.bgElevated,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandBlock: {flex: 1},
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 1,
      gap: 3,
    },
    city: {maxWidth: 200},
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: t.colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cartBadge: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: t.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: {color: '#fff', fontSize: 10, lineHeight: 14},
  });
