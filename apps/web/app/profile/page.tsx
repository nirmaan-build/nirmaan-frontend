'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Tag,
  User as UserIcon,
  Store,
  ClipboardList,
  Globe,
  Moon,
  HelpCircle,
  ShieldCheck,
  FileText,
  LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useActiveAreas, useUpdateArea, useUpdateMe } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { clearSession, getUser, setUser } from '@/lib/cookies';
import { SectionLabel, SettingsGroup, SettingsRow } from '../components/Settings';
import { AreaSheet } from '../components/AreaSheet';
import { LanguageSheet } from '../components/LanguageSheet';
import { ThemeToggle } from '../components/ThemeToggle';
import { SkeletonList } from '../components/Skeleton';

export default function ProfilePage() {
  const router = useRouter();
  const t = useT();
  const { ready } = useAuthGuard();
  const [user, setLocalUser] = useState(getUser());
  const { data: areas } = useActiveAreas();
  const updateMe = useUpdateMe();
  const updateArea = useUpdateArea();
  const [areaOpen, setAreaOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  if (!ready) return <SkeletonList rows={4} />;

  const city =
    areas?.find((a) => a.pincode === user?.primaryPincode)?.city ??
    user?.primaryPincode ??
    '—';
  const initial = user?.fullName?.trim()?.[0]?.toUpperCase() ?? '';

  const becomeSupplier = async () => {
    try {
      const u = await updateMe.mutateAsync({ isSupplier: true });
      setUser(u);
      setLocalUser(u);
      toast.success(t('profile.supplierSuccess'));
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };
  const onSelectArea = async (pincode: string) => {
    setAreaOpen(false);
    try {
      const u = await updateArea.mutateAsync(pincode);
      setUser(u);
      setLocalUser(u);
      const newCity = areas?.find((a) => a.pincode === pincode)?.city ?? pincode;
      toast.success(t('header.areaUpdated'), { description: newCity });
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };
  const logout = () => {
    clearSession();
    router.replace('/login');
  };

  return (
    <>
      <h1 style={{ textAlign: 'center' }}>{t('profile.title')}</h1>

      {/* Identity */}
      <div className="profile-identity">
        <div className="profile-avatar">{initial ? <span>{initial}</span> : <UserIcon size={34} />}</div>
        <strong className="profile-name">{user?.fullName ?? ''}</strong>
        <span className="muted">{user?.email ?? user?.phone ?? ''}</span>
      </div>

      {/* Info tiles */}
      <div className="profile-tiles">
        <div className="profile-tile">
          <span className="profile-tile-icon"><MapPin size={18} /></span>
          <span className="profile-tile-body">
            <span className="muted profile-tile-label">{t('profile.area')}</span>
            <strong>{city}</strong>
          </span>
        </div>
        <div className="profile-tile">
          <span className="profile-tile-icon">{user?.isSupplier ? <Tag size={18} /> : <UserIcon size={18} />}</span>
          <span className="profile-tile-body">
            <span className="muted profile-tile-label">{t('profile.accountType')}</span>
            <strong>{user?.isSupplier ? t('profile.supplierBadge') : t('profile.buyer')}</strong>
          </span>
        </div>
      </div>

      {/* Account */}
      <SectionLabel>{t('profile.account')}</SectionLabel>
      <SettingsGroup>
        {!user?.isSupplier ? (
          <SettingsRow
            Icon={Store}
            title={t('profile.becomeSupplier')}
            subtitle={t('profile.becomeSupplierSub')}
            onClick={becomeSupplier}
          />
        ) : null}
        <SettingsRow
          Icon={ClipboardList}
          title={t('profile.myRequirements')}
          subtitle={t('profile.myRequirementsSub')}
          href="/requirements"
        />
        <SettingsRow
          Icon={MapPin}
          title={t('profile.switchArea')}
          subtitle={t('profile.switchAreaSub')}
          onClick={() => setAreaOpen(true)}
        />
      </SettingsGroup>

      {/* General settings */}
      <SectionLabel>{t('profile.general')}</SectionLabel>
      <SettingsGroup>
        <SettingsRow
          Icon={Globe}
          title={t('profile.language')}
          subtitle={t('profile.languageSub')}
          onClick={() => setLangOpen(true)}
        />
        <SettingsRow
          Icon={Moon}
          title={t('profile.darkMode')}
          subtitle={t('profile.darkModeSub')}
          right={<ThemeToggle variant="switch" />}
        />
      </SettingsGroup>

      {/* Support & legal */}
      <SectionLabel>{t('profile.support')}</SectionLabel>
      <SettingsGroup>
        <SettingsRow Icon={HelpCircle} title={t('profile.help')} subtitle={t('profile.helpSub')} href="/help" />
        <SettingsRow Icon={ShieldCheck} title={t('profile.privacy')} subtitle={t('profile.privacySub')} href="/privacy" />
        <SettingsRow Icon={FileText} title={t('profile.terms')} subtitle={t('profile.termsSub')} href="/terms" />
      </SettingsGroup>

      {/* Logout */}
      <SettingsGroup>
        <SettingsRow
          Icon={LogOut}
          title={t('profile.logout')}
          subtitle={t('profile.logoutSub')}
          onClick={logout}
          danger
        />
      </SettingsGroup>

      <AreaSheet
        open={areaOpen}
        onClose={() => setAreaOpen(false)}
        areas={areas ?? []}
        selected={user?.primaryPincode ?? undefined}
        onSelect={onSelectArea}
      />
      <LanguageSheet open={langOpen} onClose={() => setLangOpen(false)} />
    </>
  );
}
