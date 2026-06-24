'use client';

import { useState } from 'react';
import { Mail, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { useRequestOtp, useVerifyOtp } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { setSession, setLocaleCookie } from '@/lib/cookies';
import { ApiError } from '@/lib/clientApi';

export default function LoginPage() {
  const t = useT();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const sendCode = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(t('auth.invalidEmail'));
      return;
    }
    try {
      await requestOtp.mutateAsync(email.trim());
      setStep('code');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    }
  };

  const verify = async () => {
    try {
      const s = await verifyOtp.mutateAsync({ email: email.trim(), code });
      setSession({ accessToken: s.accessToken, refreshToken: s.refreshToken, user: s.user });
      const pref = s.user.preferredLocale;
      if (pref === 'en' || pref === 'hi') setLocaleCookie(pref);
      // Full reload so the SSR'd Home (force-dynamic) re-renders with the new
      // session — then land on Home (or onboarding if the profile is incomplete).
      window.location.assign(s.user.profileComplete ? '/' : '/onboarding');
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('auth.wrongCode'));
      setCode('');
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <h1>{t('auth.title')}</h1>
      {step === 'email' ? (
        <div className="card">
          <p className="muted">{t('auth.subtitle')}</p>
          <label>{t('auth.emailLabel')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('auth.emailPlaceholder')}
          />
          <button
            className="primary"
            style={{ marginTop: 12 }}
            onClick={sendCode}
            disabled={requestOtp.isPending}
          >
            <Mail size={17} />
            {requestOtp.isPending ? t('auth.sending') : t('auth.sendCode')}
          </button>
        </div>
      ) : (
        <div className="card">
          <p className="muted">{t('auth.otpSubtitle', { email })}</p>
          <label>{t('auth.otpTitle')}</label>
          <input
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="••••••"
          />
          <button
            className="primary"
            style={{ marginTop: 12 }}
            onClick={verify}
            disabled={verifyOtp.isPending || code.length !== 6}
          >
            <KeyRound size={17} />
            {verifyOtp.isPending ? t('auth.verifying') : t('auth.otpTitle')}
          </button>
          <button className="block" style={{ marginTop: 8 }} onClick={() => setStep('email')}>
            {t('common.cancel')}
          </button>
        </div>
      )}
    </div>
  );
}
