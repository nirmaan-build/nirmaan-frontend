'use client';

import { useParams } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useRfq } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { money } from '@/lib/format';
import { SkeletonList } from '../../components/Skeleton';

export default function RfqDetailPage() {
  const t = useT();
  const { ready } = useAuthGuard();
  const params = useParams<{ id: string }>();
  const { data: rfq, isLoading } = useRfq(params.id);

  if (!ready || isLoading) return <SkeletonList rows={3} />;
  if (!rfq) return <p className="muted">{t('common.somethingWrong')}</p>;

  const leads = rfq.leads ?? [];

  return (
    <>
      <h1 className="page-title">{t('postRfq.title')}</h1>
      <div className="card">
        <strong>{rfq.description}</strong>
        <div className="meta">
          {t('requirements.quantity', { quantity: String(rfq.quantity), unit: rfq.unit })}
        </div>
        <div className="meta" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {t(`rfqStatus.${rfq.status}`)} · <MapPin size={14} /> {rfq.pincode}
        </div>
      </div>

      <h2>{t('requirements.leads', { count: leads.length })}</h2>
      {leads.length === 0 ? (
        <p className="muted">{t('postRfq.confirmUnmatched')}</p>
      ) : (
        leads.map((lead) => {
          const lq = lead as typeof lead & {
            supplier?: { businessName: string };
            quotes?: { id: string; price: string | number; status: string }[];
          };
          return (
            <div key={lead.id} className="card">
              <strong>{lq.supplier?.businessName ?? 'Supplier'}</strong>
              <div className="meta">{lead.status}</div>
              {(lq.quotes ?? []).map((quote) => (
                <div key={quote.id} className="meta">
                  {money(quote.price)} · {quote.status}
                </div>
              ))}
            </div>
          );
        })
      )}
    </>
  );
}
