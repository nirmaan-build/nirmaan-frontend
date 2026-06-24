import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme, useThemedStyles, type Theme } from '../theme';
import { useT } from '../i18n';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useActiveAreas, useUpdateArea, useUpdateMe } from '../api/hooks';
import type { Area } from '../api/types';
import { Card } from '../components/Card';
import { Icon, type IconName } from '../components/Icon';
import { AppText } from '../components/Typography';
import { AreaPickerModal } from '../components/AreaPickerModal';
import { LanguagePickerModal } from '../components/LanguagePickerModal';
import { withGlobalLoader } from '../store/uiStore';
import { toast } from '../lib/toast';

/** A grouped settings row: tinted icon tile, title + subtitle, right accessory. */
function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
  right,
  danger,
  first,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  first?: boolean;
}) {
  const t = useTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      style={[styles.row, !first && styles.rowDivider]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconTile, danger && styles.iconTileDanger]}>
        <Icon
          name={icon}
          size={18}
          color={danger ? t.colors.danger : t.colors.primary}
        />
      </View>
      <View style={styles.rowBody}>
        <AppText variant="subtitle" color={danger ? 'danger' : 'text'}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ?? (
        <Icon name="chevronRight" size={20} color={t.colors.muted} />
      )}
    </Pressable>
  );
}

export function ProfileScreen() {
  const t = useT();
  const th = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(makeStyles);
  const nav = useNavigation<any>();

  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);
  const updateMe = useUpdateMe();
  const updateArea = useUpdateArea();
  const { data: areas } = useActiveAreas();

  const setThemeMode = useSettingsStore((s) => s.setThemeMode);

  const [areaOpen, setAreaOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const city =
    areas?.find((a: Area) => a.pincode === user?.primaryPincode)?.city ??
    user?.primaryPincode ??
    '—';
  const initial = (user?.fullName ?? '').trim().charAt(0).toUpperCase();

  const becomeSupplier = async () => {
    try {
      const updated = await withGlobalLoader(
        updateMe.mutateAsync({ isSupplier: true }),
        t('profile.becomeSupplier'),
      );
      await setUser(updated);
      toast.success(t('profile.supplierSuccess'));
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  const onSelectArea = async (pincode: string) => {
    setAreaOpen(false);
    try {
      const updated = await withGlobalLoader(updateArea.mutateAsync(pincode));
      await setUser(updated);
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <AppText variant="title">{t('profile.title')}</AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity */}
        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {initial ? (
                <AppText variant="h1" color="primary">
                  {initial}
                </AppText>
              ) : (
                <Icon name="user" size={34} color={th.colors.primary} />
              )}
            </View>
           
          </View>
          <AppText variant="title">{user?.fullName ?? ''}</AppText>
          <AppText variant="caption" color="muted">
            {user?.email ?? user?.phone ?? ''}
          </AppText>
        </View>

        {/* Info tiles */}
        <View style={styles.tiles}>
          <View style={styles.tile}>
            <View style={styles.tileIcon}>
              <Icon name="location" size={18} color={th.colors.primary} />
            </View>
            <View style={styles.tileBody}>
              <AppText variant="caption" color="muted">
                {t('profile.area')}
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {city}
              </AppText>
            </View>
          </View>
          <View style={styles.tile}>
            <View style={styles.tileIcon}>
              <Icon
                name={user?.isSupplier ? 'supplier' : 'user'}
                size={18}
                color={th.colors.primary}
              />
            </View>
            <View style={styles.tileBody}>
              <AppText variant="caption" color="muted">
                {t('profile.accountType')}
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={1}>
                {user?.isSupplier
                  ? t('profile.supplierBadge')
                  : t('profile.buyer')}
              </AppText>
            </View>
          </View>
        </View>

        {/* Account */}
        <AppText variant="label" color="muted" style={styles.sectionLabel}>
          {t('profile.account')}
        </AppText>
        <Card style={styles.group} flat>
          {!user?.isSupplier ? (
            <SettingsRow
              first
              icon="supplier"
              title={t('profile.becomeSupplier')}
              subtitle={t('profile.becomeSupplierSub')}
              onPress={becomeSupplier}
            />
          ) : null}
          <SettingsRow
            first={user?.isSupplier}
            icon="requirements"
            title={t('profile.myRequirements')}
            subtitle={t('profile.myRequirementsSub')}
            onPress={() => nav.navigate('MyRequirements')}
          />
          <SettingsRow
            icon="package"
            title={t('profile.myOrders')}
            subtitle={t('profile.myOrdersSub')}
            onPress={() => nav.navigate('MyOrders')}
          />
          <SettingsRow
            icon="location"
            title={t('profile.switchArea')}
            subtitle={t('profile.switchAreaSub')}
            onPress={() => setAreaOpen(true)}
          />
        </Card>

        {/* General settings */}
        <AppText variant="label" color="muted" style={styles.sectionLabel}>
          {t('profile.general')}
        </AppText>
        <Card style={styles.group} flat>
          <SettingsRow
            first
            icon="language"
            title={t('profile.language')}
            subtitle={t('profile.languageSub')}
            onPress={() => setLangOpen(true)}
          />
          <SettingsRow
            icon="moon"
            title={t('profile.darkMode')}
            subtitle={t('profile.darkModeSub')}
            right={
              <Switch
                value={th.isDark}
                onValueChange={(on) => setThemeMode(on ? 'dark' : 'light')}
                trackColor={{ false: th.colors.border, true: th.colors.primary }}
                thumbColor="#ffffff"
                ios_backgroundColor={th.colors.border}
              />
            }
          />
        </Card>

        {/* Support & legal */}
        <AppText variant="label" color="muted" style={styles.sectionLabel}>
          {t('profile.support')}
        </AppText>
        <Card style={styles.group} flat>
          <SettingsRow
            first
            icon="help"
            title={t('profile.help')}
            subtitle={t('profile.helpSub')}
            onPress={() => nav.navigate('Content', { type: 'help' })}
          />
          <SettingsRow
            icon="privacy"
            title={t('profile.privacy')}
            subtitle={t('profile.privacySub')}
            onPress={() => nav.navigate('Content', { type: 'privacy' })}
          />
          <SettingsRow
            icon="terms"
            title={t('profile.terms')}
            subtitle={t('profile.termsSub')}
            onPress={() => nav.navigate('Content', { type: 'terms' })}
          />
        </Card>

        {/* Logout */}
        <Card style={styles.group} flat>
          <SettingsRow
            first
            danger
            icon="logout"
            title={t('profile.logout')}
            subtitle={t('profile.logoutSub')}
            onPress={signOut}
          />
        </Card>
        <View style={{ height: 8 }} />
      </ScrollView>

      <AreaPickerModal
        visible={areaOpen}
        onClose={() => setAreaOpen(false)}
        onSelect={onSelectArea}
        selectedPincode={user?.primaryPincode ?? undefined}
      />
      <LanguagePickerModal visible={langOpen} onClose={() => setLangOpen(false)} />
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.colors.bg },
    topBar: {
      backgroundColor: t.colors.bgElevated,
      paddingBottom: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.colors.border,
    },
    content: { padding: 16, paddingBottom: 24 },

    identity: { alignItems: 'center', marginTop: 8, marginBottom: 20 },
    avatarWrap: { marginBottom: 12 },
    avatar: {
      width: 92,
      height: 92,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    editBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 28,
      height: 28,
      borderRadius: t.radius.pill,
      backgroundColor: t.colors.primary,
      borderWidth: 3,
      borderColor: t.colors.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    tiles: { flexDirection: 'row', gap: 12, marginBottom: 22 },
    tile: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: t.colors.card,
      borderWidth: 1,
      borderColor: t.colors.border,
      borderRadius: t.radius.lg,
      padding: 12,
      ...t.elevation.card,
    },
    tileIcon: {
      width: 38,
      height: 38,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tileBody: { flex: 1 },

    sectionLabel: { marginBottom: 10, marginLeft: 4, textTransform: 'uppercase' },
    group: { marginBottom: 22, padding: 0 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    rowDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: t.colors.border,
    },
    iconTile: {
      width: 40,
      height: 40,
      borderRadius: t.radius.md,
      backgroundColor: t.colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconTileDanger: { backgroundColor: 'rgba(192, 57, 43, 0.12)' },
    rowBody: { flex: 1 },
  });
