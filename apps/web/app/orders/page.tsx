'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useOrders } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { money } from '@/lib/format';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

/** My Orders — buyer + supplier list views (PRD-02 §3.11 / PRD-04). List only;
 *  the tracking timeline comes in Stage 10. */
export default function OrdersPage() {
  const t = useT();
  const { ready } = useAuthGuard();
  const [role, setRole] = useState<'buyer' | 'supplier'>('buyer');
  const { data: orders, isLoading } = useOrders(role);

  return (
    <>
      <h1 className="page-title">
        {role === 'supplier' ? t('orders.supplierTitle') : t('orders.title')}
      </h1>

      <div className="row" style={{ gap: 8, marginBottom: 12 }}>
        <button
          className={role === 'buyer' ? 'primary' : ''}
          onClick={() => setRole('buyer')}
        >
          {t('orders.asBuyer')}
        </button>
        <button
          className={role === 'supplier' ? 'primary' : ''}
          onClick={() => setRole('supplier')}
        >
          {t('orders.asSupplier')}
        </button>
      </div>

      {!ready || isLoading ? (
        <SkeletonList rows={4} />
      ) : (orders?.length ?? 0) === 0 ? (
        <EmptyState Icon={PackageCheck} title={t('orders.empty')} />
      ) : (
        (orders ?? []).map((o) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="card"
            style={{ display: 'block' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong style={{ flex: 1 }}>
                {role === 'supplier'
                  ? o.buyer?.fullName ?? '—'
                  : o.supplier?.businessName ?? '—'}
              </strong>
              <span className="badge status-pill">
                {t(`orderStatus.${o.status}`)}
              </span>
            </div>
            <div className="meta">
              {t('orders.amount', { amount: money(o.totalAmount) })}
            </div>
            <div className="meta">
              {t('orders.placedOn', {
                date: new Date(o.placedAt).toLocaleDateString(),
              })}
            </div>
          </Link>
        ))
      )}
    </>
  );
}
