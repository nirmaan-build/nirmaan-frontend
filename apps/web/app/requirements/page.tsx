'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardList, Ruler } from 'lucide-react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useMyRfqs, useMyUnitRequests } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

type Tab = 'rfqs' | 'units';

const UNIT_STATUS_CLASS: Record<string, string> = {
  PENDING: 'warn',
  APPROVED: 'active',
  MAPPED: 'active',
  REJECTED: 'inactive',
};

/** My Requirements — split into two sub-tabs: RFQ requirements and Unit requests. */
export default function RequirementsPage() {
  const t = useT();
  const { ready } = useAuthGuard();
  const { data: rfqs, isLoading: rfqsLoading } = useMyRfqs();
  const { data: unitRequests, isLoading: unitsLoading } = useMyUnitRequests();
  const [tab, setTab] = useState<Tab>('rfqs');

  if (!ready) {
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

      {/* ── Sub-tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '2px solid var(--border)',
          marginBottom: 16,
        }}
      >
        {([
          { key: 'rfqs', label: t('requirements.tabRfqs'), icon: ClipboardList },
          { key: 'units', label: t('requirements.tabUnits'), icon: Ruler },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2,
              background: 'transparent',
              fontWeight: tab === key ? 700 : 400,
              color: tab === key ? 'var(--primary)' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              fontSize: 14,
              borderRadius: 0,
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Requirements (RFQs) tab ── */}
      {tab === 'rfqs' && (
        rfqsLoading ? (
          <SkeletonList rows={4} />
        ) : (rfqs?.length ?? 0) === 0 ? (
          <EmptyState
            Icon={ClipboardList}
            title={t('requirements.empty')}
            action={
              <Link href="/rfq/new">
                <button className="primary sm">Post a Requirement</button>
              </Link>
            }
          />
        ) : (
          (rfqs ?? []).map((r) => {
            const leads = r._count?.leads ?? r.leads?.length ?? 0;
            return (
              <Link key={r.id} href={`/rfq/${r.id}`} className="card" style={{ display: 'block', marginBottom: 10 }}>
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
        )
      )}

      {/* ── Unit requests tab ── */}
      {tab === 'units' && (
        unitsLoading ? (
          <SkeletonList rows={3} />
        ) : (unitRequests?.length ?? 0) === 0 ? (
          <EmptyState
            Icon={Ruler}
            title={t('requirements.unitsEmpty')}
            subtitle=""
          />
        ) : (
          (unitRequests ?? []).map((ur) => (
            <div key={ur.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{ur.rawText}</p>
                  {ur.context && (
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                      Context: {ur.context}
                    </p>
                  )}
                  {ur.resolvedUnit && (
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--primary)' }}>
                      Mapped to: <strong>{ur.resolvedUnit.name}</strong> ({ur.resolvedUnit.shortCode})
                    </p>
                  )}
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--muted)' }}>
                    {new Date(ur.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`badge ${UNIT_STATUS_CLASS[ur.status] ?? 'inactive'}`} style={{ flexShrink: 0 }}>
                  {t(`requirements.unitStatus.${ur.status}`) ?? ur.status}
                </span>
              </div>
            </div>
          ))
        )
      )}
    </>
  );
}
