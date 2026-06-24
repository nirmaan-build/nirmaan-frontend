'use client';

import Link from 'next/link';
import { ClipboardList } from 'lucide-react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useMyRfqs } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

/** My Requirements — the posted RFQs list, its own page (linked from Profile). */
export default function RequirementsPage() {
  const t = useT();
  const { ready } = useAuthGuard();
  const { data: rfqs, isLoading } = useMyRfqs();

  if (!ready || isLoading) {
    return (
      <>
        <h1 className="page-title">{t('requirements.title')}</h1>
        <SkeletonList rows={4} />
      </>
    );
  }

  return (
    <>
      <h1 className="page-title">{t('requirements.title')}</h1>
      {(rfqs?.length ?? 0) === 0 ? (
        <EmptyState Icon={ClipboardList} title={t('requirements.empty')} />
      ) : (
        (rfqs ?? []).map((r) => {
          const leads = r._count?.leads ?? r.leads?.length ?? 0;
          return (
            <Link key={r.id} href={`/rfq/${r.id}`} className="card" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <strong style={{ flex: 1 }}>{r.description}</strong>
                <span className="badge status-pill">{t(`rfqStatus.${r.status}`)}</span>
              </div>
              <div className="meta">
                {t('requirements.quantity', { quantity: String(r.quantity), unit: r.unit })}
              </div>
              <div className="meta">{t('requirements.leads', { count: leads })}</div>
            </Link>
          );
        })
      )}
    </>
  );
}
