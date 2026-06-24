'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { usePaymentLink } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { money } from '@/lib/format';
import { SkeletonList } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';

/**
 * Payment-link landing (PRD-03 §4.7) — the web fallback for nirmaan://pay/:id.
 * We first try to hand off to the installed app via the custom scheme; if that
 * doesn't take over, we send the buyer to the hosted Razorpay page. Payment is
 * confirmed server-side by the verified webhook, which creates the Order.
 */
export default function PayLinkPage() {
  const t = useT();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const { ready } = useAuthGuard();
  const { data, isLoading, isError } = usePaymentLink(id);
  const handedOff = useRef(false);

  useEffect(() => {
    if (!data?.url || data.status === 'PAID' || handedOff.current) return;
    handedOff.current = true;
    // Try the app first (no-op on desktop / app-less devices), then fall back
    // to the hosted Razorpay page after a short grace period.
    try {
      window.location.href = `nirmaan://pay/${id}`;
    } catch {
      /* scheme not registered — fall through to the web redirect */
    }
    const fallback = window.setTimeout(() => {
      window.location.href = data.url;
    }, 1200);
    return () => window.clearTimeout(fallback);
  }, [data?.url, data?.status, id]);

  if (!ready || isLoading) return <SkeletonList rows={2} />;

  if (isError || !data) {
    return <EmptyState Icon={CreditCard} title={t('payLink.notFound')} />;
  }

  const paid = data.status === 'PAID';

  return (
    <div style={{ textAlign: 'center', paddingTop: 24 }}>
      <CreditCard size={48} style={{ color: 'var(--primary)' }} />
      <h1 className="page-title" style={{ marginTop: 12 }}>
        {t('payLink.title')}
      </h1>
      <div className="title-lg">{money(data.amount)}</div>

      {paid ? (
        <>
          <p className="meta">{t('payLink.alreadyPaid')}</p>
          <button className="primary" onClick={() => router.push('/orders')}>
            {t('payLink.viewOrders')}
          </button>
        </>
      ) : (
        <>
          <p className="meta">{t('payLink.subtitle')}</p>
          <a className="primary" href={data.url} style={{ display: 'inline-block' }}>
            {t('payLink.openButton')}
          </a>
          <div>
            <button
              style={{ marginTop: 12 }}
              onClick={() => router.push('/orders')}
            >
              {t('payLink.viewOrders')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
