'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useActiveAreas, useUpdateMe } from '@/lib/queries';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useT } from '@/lib/i18n-client';
import { setUser } from '@/lib/cookies';
import { LanguageToggle } from '../components/LanguageToggle';
import { AreaPicker } from '../components/AreaPicker';
import { ApiError } from '@/lib/clientApi';

export default function OnboardingPage() {
  const t = useT();
  const { ready } = useAuthGuard(false); // logged in, but profile may be incomplete
  const { data: areas } = useActiveAreas();
  const updateMe = useUpdateMe();
  const [name, setName] = useState('');
  const [pincode, setPincode] = useState('');

  if (!ready) return <p className="muted">{t('common.loading')}</p>;

  const onContinue = async () => {
    if (!name.trim() || !pincode) return;
    try {
      const u = await updateMe.mutateAsync({
        fullName: name.trim(),
        primaryPincode: pincode,
      });
      setUser(u);
      window.location.assign('/'); // full reload so SSR Home reflects the new session
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <h1>{t('onboarding.title')}</h1>
      <div className="card">
        <label>{t('onboarding.nameLabel')}</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('onboarding.namePlaceholder')}
        />

        <label>{t('onboarding.areaLabel')}</label>
        <AreaPicker
          areas={areas ?? []}
          value={pincode}
          onChange={setPincode}
          placeholder={t('onboarding.areaPlaceholder')}
          showState
        />

        <label>{t('onboarding.languageLabel')}</label>
        <LanguageToggle />

        <button
          className="primary"
          style={{ marginTop: 18 }}
          onClick={onContinue}
          disabled={updateMe.isPending || !name.trim() || !pincode}
        >
          {updateMe.isPending ? t('onboarding.saving') : t('onboarding.continue')}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
