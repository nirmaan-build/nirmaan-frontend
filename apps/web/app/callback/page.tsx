'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, CheckCircle2, BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useRequestCallback } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { getUser } from '@/lib/cookies';
import { SkeletonList } from '../components/Skeleton';

/**
 * "Request a Callback" (PRD-03 §4.6–4.7). Framing rule: this is "talk to us
 * first" — a concierge channel, never a broken-checkout fallback. On submit we
 * show an honest response-time expectation.
 */
export default function CallbackPage() {
  const t = useT();
  const router = useRouter();
  const { ready } = useAuthGuard();
  const requestCallback = useRequestCallback();

  const [phone, setPhone] = useState(() => getUser()?.phone ?? '');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);

  if (!ready) return <SkeletonList rows={3} />;

  const phoneValid = /^(\+91|0)?[6-9]\d{9}$/.test(phone.trim());

  const submit = async () => {
    try {
      await requestCallback.mutateAsync({
        preferredPhone: phone.trim(),
        note: note.trim() || undefined,
      });
      setDone(true);
    } catch {
      toast.error(t('callback.error'));
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 24 }}>
        <CheckCircle2 size={56} style={{ color: 'var(--primary)' }} />
        <h1 className="page-title" style={{ marginTop: 12 }}>
          {t('callback.confirmTitle')}
        </h1>
        <p className="meta">{t('callback.confirmBody')}</p>
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            justifyContent: 'center',
            background: 'var(--primary-muted, rgba(0,0,0,0.04))',
            marginTop: 16,
          }}
        >
          <BellRing size={18} style={{ color: 'var(--primary)' }} />
          <strong>{t('callback.responseTime')}</strong>
        </div>
        <button
          className="primary"
          style={{ marginTop: 20 }}
          onClick={() => router.push('/truck')}
        >
          {t('callback.backToTruck')}
        </button>
      </div>
    );
  }

  return (
    <>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Phone size={22} /> {t('callback.title')}
      </h1>
      <p className="meta" style={{ marginBottom: 16 }}>
        {t('callback.lede')}
      </p>

      <label className="meta">{t('callback.phoneLabel')}</label>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder={t('callback.phonePlaceholder')}
        style={{ width: '100%', marginBottom: 14 }}
      />

      <label className="meta">{t('callback.noteLabel')}</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('callback.notePlaceholder')}
        rows={3}
        style={{ width: '100%', marginBottom: 16 }}
      />

      <button
        className="primary"
        style={{ width: '100%' }}
        disabled={!phoneValid || requestCallback.isPending}
        onClick={submit}
      >
        {t('callback.submit')}
      </button>
      <p className="meta" style={{ textAlign: 'center', marginTop: 12 }}>
        {t('callback.reassure')}
      </p>
    </>
  );
}
