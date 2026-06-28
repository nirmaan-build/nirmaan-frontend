'use client';

import { useRouter } from 'next/navigation';
import { Store, Package, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useSupplierCatalog, useOrders, useAdvanceOrder } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { money } from '@/lib/format';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { getUser } from '@/lib/cookies';

const ORDER_STATUS_NEXT: Record<string, { label: string; next: string } | null> = {
  PLACED: { label: 'Confirm', next: 'CONFIRMED' },
  CONFIRMED: { label: 'Processing', next: 'PROCESSING' },
  PROCESSING: { label: 'Dispatched', next: 'DISPATCHED' },
  DISPATCHED: { label: 'Delivered', next: 'DELIVERED' },
  DELIVERED: null,
  CANCELLED: null,
  DISPUTED: null,
};

export default function SupplierPage() {
  const router = useRouter();
  const t = useT();
  const { ready } = useAuthGuard();
  const user = getUser();

  const { data: listings, isLoading: listingsLoading } = useSupplierCatalog();
  const { data: orders, isLoading: ordersLoading } = useOrders('supplier');
  const advance = useAdvanceOrder();

  if (!ready) return <SkeletonList rows={4} />;

  // If user isn't a supplier, show a prompt
  if (user && !user.isSupplier) {
    return (
      <EmptyState
        Icon={Store}
        title="Supplier access required"
        subtitle="You are not registered as a supplier. Enable supplier mode in your profile."
        action={
          <button className="primary" onClick={() => router.push('/profile')}>
            Go to Profile
          </button>
        }
      />
    );
  }

  const onAdvance = async (orderId: string, status: string) => {
    try {
      await advance.mutateAsync({ orderId, status });
      toast.success(`Order marked ${status.toLowerCase()}`);
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  const onCancel = async (orderId: string) => {
    try {
      await advance.mutateAsync({ orderId, status: 'CANCELLED' });
      toast.success('Order cancelled');
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  return (
    <>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Store size={24} /> {t('supplier.myStore')}
      </h1>

      {/* ── Incoming Orders ─────────────────────────────── */}
      <h2 style={{ marginTop: 24 }}>{t('supplier.orders')}</h2>

      {ordersLoading ? (
        <SkeletonList rows={3} />
      ) : !orders?.length ? (
        <div className="card muted" style={{ textAlign: 'center', padding: '24px 16px' }}>
          {t('supplier.ordersEmpty')}
        </div>
      ) : (
        orders.map((order) => {
          const transition = ORDER_STATUS_NEXT[order.status];
          return (
            <div key={order.id} className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {order.buyer?.fullName ?? order.buyer?.phone ?? 'Buyer'}
                </span>
                <span
                  className={`badge ${
                    order.status === 'PLACED' ? 'warn'
                    : order.status === 'DELIVERED' ? 'active'
                    : order.status === 'CANCELLED' ? 'inactive'
                    : 'active'
                  }`}
                  style={{ marginLeft: 'auto' }}
                >
                  {order.status}
                </span>
              </div>

              <div className="meta" style={{ marginTop: 4 }}>
                {order.deliveryAddress ? `${order.deliveryAddress.label} · ` : ''}
                {money(order.totalAmount)}
              </div>

              <div className="meta">
                {new Date(order.placedAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </div>

              {(transition || order.status === 'PLACED') && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {transition && (
                    <button
                      className="primary sm"
                      onClick={() => onAdvance(order.id, transition.next)}
                      disabled={advance.isPending}
                    >
                      <Check size={14} />
                      {transition.label}
                    </button>
                  )}
                  {(order.status === 'PLACED' || order.status === 'CONFIRMED') && (
                    <button
                      className="danger sm"
                      onClick={() => onCancel(order.id)}
                      disabled={advance.isPending}
                    >
                      <X size={14} />
                      {t('supplier.cancelOrder')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* ── My Listings ─────────────────────────────────── */}
      <h2 style={{ marginTop: 32 }}>{t('supplier.listings')}</h2>

      {listingsLoading ? (
        <SkeletonList rows={3} />
      ) : !listings?.length ? (
        <div className="card muted" style={{ textAlign: 'center', padding: '24px 16px' }}>
          {t('supplier.listingsEmpty')}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {listings.map((item) => {
            const img = item.imageUrls?.[0];
            return (
              <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 120, background: 'var(--skeleton)', flexShrink: 0 }}>
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={32} style={{ color: 'var(--muted)', opacity: 0.4 }} />
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{item.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>{item.category.name}</p>
                  {item.priceEstimate && (
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                      {money(item.priceEstimate)} / {item.unit}
                    </p>
                  )}
                  <span
                    className={`badge ${item.isActive ? 'active' : 'inactive'}`}
                    style={{ alignSelf: 'flex-start', marginTop: 4 }}
                  >
                    {item.isActive ? t('supplier.active') : t('supplier.inactive')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
