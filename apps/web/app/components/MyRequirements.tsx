'use client';

import Link from 'next/link';
import { ArrowRight, ClipboardList, Plus } from 'lucide-react';
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

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'var(--ok)',
  MATCHED: 'var(--ok)',
  QUOTED: 'var(--primary)',
  UNMATCHED: 'var(--muted)',
  CLOSED: 'var(--muted)',
  EXPIRED: 'var(--muted)',
};

/**
 * Client component — rendered only when the user is logged in.
 * Shows the 4 most recent RFQs on the homepage as a 2-col grid.
 */
export function MyRequirements() {
  const t = useT();
  const user = getUser();
  const { data: rfqList = [], isLoading } = useMyRfqs();

  if (!user) return null;

  const recent = rfqList.slice(0, 4);

  return (
    <section>
      <div className="section-head">
        <h2>{t('home.myRequirements')}</h2>
        <Link href="/requirements" className="view-all">
          {t('home.viewAll')}
        </Link>
      </div>

      {isLoading ? (
        <div className="req-grid">
          {[0, 1].map((i) => (
            <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--r-lg)' }} />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div
          className="card"
          style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--muted)' }}
        >
          <ClipboardList size={20} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 14, flex: 1 }}>{t('requirements.empty')}</span>
          <Link href="/rfq/new" style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <button className="primary sm">
              <Plus size={15} />
              {t('postRfq.title')}
            </button>
          </Link>
        </div>
      ) : (
        <>
          <div className="req-grid">
            {recent.map((rfq: any) => {
              const color = STATUS_COLOR[rfq.status] ?? 'var(--muted)';
              return (
                <Link key={rfq.id} href={`/rfq/${rfq.id}`} className="req-card">
                  {/* Status dot + label */}
                  <div className="req-status" style={{ color }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: color,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    />
                    {STATUS_LABEL[rfq.status] ?? rfq.status}
                  </div>
                  {/* Description */}
                  <p className="req-desc">{rfq.description}</p>
                  {/* Qty + unit */}
                  <p className="req-qty">
                    {Number(rfq.quantity).toLocaleString('en-IN')} {rfq.unit}
                  </p>
                </Link>
              );
            })}
            {/* "Post new" tile */}
            <Link href="/rfq/new" className="req-card req-new-tile">
              <Plus size={22} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginTop: 4 }}>
                {t('postRfq.title')}
              </span>
            </Link>
          </div>
          {(rfqList as any[]).length > 4 && (
            <Link href="/requirements">
              <button style={{ width: '100%', marginTop: 4 }}>
                {t('profile.viewRequirements')} <ArrowRight size={16} />
              </button>
            </Link>
          )}
        </>
      )}
    </section>
  );
}
