'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList } from 'lucide-react';
import { useMyRfqs } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { getUser } from '@/lib/cookies';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  MATCHED: 'Matched',
  UNMATCHED: 'Unmatched',
  QUOTED: 'Quoted',
  CLOSED: 'Closed',
  EXPIRED: 'Expired',
};

const STATUS_CLASS: Record<string, string> = {
  OPEN: 'active',
  MATCHED: 'active',
  QUOTED: 'active',
  UNMATCHED: 'warn',
  CLOSED: 'inactive',
  EXPIRED: 'inactive',
};

/**
 * Client component — rendered only when the user is logged in.
 * Shows the 3 most recent RFQs on the homepage with a link to /requirements.
 */
export function MyRequirements() {
  const t = useT();
  const user = getUser();
  const { data: rfqs, isLoading } = useMyRfqs();

  // Only visible when logged in
  if (!user) return null;

  const recent = (rfqs ?? []).slice(0, 3);

  return (
    <section>
      <div className="section-head">
        <h2>{t('home.myRequirements')}</h2>
        <Link href="/requirements" className="view-all">
          {t('home.viewAll')}
        </Link>
      </div>

      {isLoading ? (
        <div className="card" style={{ height: 72 }} />
      ) : recent.length === 0 ? (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--muted)' }}>
          <ClipboardList size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14 }}>{t('requirements.empty')}</span>
          <Link href="/rfq/new" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <button className="primary sm">{t('postRfq.title')}</button>
          </Link>
        </div>
      ) : (
        <>
          {recent.map((rfq) => (
            <div key={rfq.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
              <ClipboardList size={18} style={{ flexShrink: 0, color: 'var(--primary)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {rfq.description}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                  {Number(rfq.quantity).toLocaleString('en-IN')} {rfq.unit}
                </p>
              </div>
              <span className={`badge ${STATUS_CLASS[rfq.status] ?? 'inactive'}`} style={{ flexShrink: 0 }}>
                {STATUS_LABEL[rfq.status] ?? rfq.status}
              </span>
            </div>
          ))}
          {(rfqs ?? []).length > 3 && (
            <Link href="/requirements">
              <button style={{ width: '100%' }}>
                {t('profile.viewRequirements')} <ArrowRight size={16} />
              </button>
            </Link>
          )}
        </>
      )}
    </section>
  );
}
