'use client';

import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Bike,
  Car,
  Truck,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  Phone,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { money } from '@/lib/format';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

// Same tier thresholds as the mobile app (PRD-02 §3.8); label stays "My Truck".
function truckIcon(count: number): LucideIcon {
  if (count <= 0) return ShoppingCart;
  if (count <= 5) return Bike;
  if (count <= 15) return Car;
  return Truck;
}

export default function TruckPage() {
  const router = useRouter();
  const t = useT();
  const { ready } = useAuthGuard();
  const { data, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  if (!ready) return <SkeletonList rows={3} />;

  const count = data?.total_item_count ?? 0;
  const TruckTier = truckIcon(count);
  const setQty = (itemId: string, qty: number) => {
    if (qty < 1) return;
    void updateItem.mutateAsync({ itemId, quantity: qty });
  };
  const onRemove = (itemId: string) => {
    removeItem.mutate(itemId, {
      onSuccess: () => toast.success(t('truck.remove')),
      onError: () => toast.error(t('common.somethingWrong')),
    });
  };

  return (
    <>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TruckTier size={26} /> {t('truck.title')}
      </h1>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : count === 0 ? (
        <EmptyState
          Icon={ShoppingCart}
          title={t('truck.emptyTitle')}
          subtitle={t('truck.emptyBody')}
          action={
            <button onClick={() => router.push('/categories')}>
              {t('categories.browseAll')}
            </button>
          }
        />
      ) : (
        <>
          {(data?.items ?? []).map((it) => {
            const qty = Number(it.quantity);
            const price = it.catalogItem.priceEstimate
              ? Number(it.catalogItem.priceEstimate)
              : 0;
            return (
              <div key={it.id} className="card">
                <strong>{it.catalogItem.title}</strong>
                <div className="meta">
                  {money(it.catalogItem.priceEstimate)} / {it.catalogItem.unit.shortCode}
                </div>
                <div
                  className="row"
                  style={{ marginTop: 12, alignItems: 'center' }}
                >
                  <div className="stepper" style={{ flex: 'none' }}>
                    <button onClick={() => setQty(it.id, qty - 1)} aria-label="decrease">
                      <Minus size={16} />
                    </button>
                    <span>{qty}</span>
                    <button onClick={() => setQty(it.id, qty + 1)} aria-label="increase">
                      <Plus size={16} />
                    </button>
                  </div>
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
                    {money(price * qty)}
                  </span>
                  <button
                    style={{ flex: 'none', color: 'var(--danger)' }}
                    onClick={() => onRemove(it.id)}
                    aria-label={t('truck.remove')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="card">
            <div className="meta">{t('truck.estimatedValue')}</div>
            <div className="title-lg">{money(data?.total_estimated_value ?? 0)}</div>
            <div className="meta">{t('truck.items', { count })}</div>
          </div>

          <button className="primary" onClick={() => router.push('/rfq/new')}>
            {t('truck.sendAsRequirement')}
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => router.push('/callback')}
            style={{ marginTop: 10, width: '100%' }}
          >
            <Phone size={18} />
            {t('callback.cta')}
          </button>
          <p className="meta" style={{ textAlign: 'center', marginTop: 8 }}>
            {t('callback.ctaHint')}
          </p>
        </>
      )}
    </>
  );
}
