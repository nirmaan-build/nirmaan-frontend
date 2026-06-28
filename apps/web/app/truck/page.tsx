'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

const DEBOUNCE_MS = 700;

/**
 * Stepper with:
 *  - Local qty state for instant visual feedback (no API latency on every tap).
 *  - Long-press support (400ms hold → 80ms repeat) for fast scroll.
 *  - Single debounced API flush after DEBOUNCE_MS of idle.
 */
function QtyControl({
  itemId,
  serverQty,
  onFlush,
  onRemove,
}: {
  itemId: string;
  serverQty: number;
  onFlush: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const [qty, setQty] = useState(serverQty);

  // Keep refs so long-press intervals and debounce timers always see the latest values.
  const qtyRef = useRef(qty);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync from server when cart refreshes (only if no pending debounce — avoids jank).
  useEffect(() => {
    if (!flushTimer.current) {
      setQty(serverQty);
      qtyRef.current = serverQty;
    }
  }, [serverQty]);

  const schedule = useCallback(
    (newQty: number) => {
      setQty(newQty);
      qtyRef.current = newQty;
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => {
        flushTimer.current = null;
        onFlush(itemId, qtyRef.current);
      }, DEBOUNCE_MS);
    },
    [itemId, onFlush],
  );

  const stopHold = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (holdInterval.current) { clearInterval(holdInterval.current); holdInterval.current = null; }
  }, []);

  const startHold = useCallback(
    (delta: number) => {
      // Single tap fires immediately
      const next = qtyRef.current + delta;
      if (next < 1) {
        // Cancel any pending debounce before removing
        if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null; }
        onRemove(itemId);
        return;
      }
      schedule(Math.min(next, 999));

      // After 400ms hold, repeat every 80ms (fast scroll)
      holdTimer.current = setTimeout(() => {
        holdInterval.current = setInterval(() => {
          const n = qtyRef.current + delta;
          if (n < 1) {
            stopHold();
            if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null; }
            onRemove(itemId);
            return;
          }
          schedule(Math.min(n, 999));
        }, 80);
      }, 400);
    },
    [itemId, onRemove, schedule, stopHold],
  );

  const handleInput = (raw: string) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || raw === '') return;
    if (n < 1) {
      if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null; }
      onRemove(itemId);
      return;
    }
    schedule(Math.min(n, 999));
  };

  return (
    <div className="stepper" style={{ flex: 'none' }}>
      <button
        aria-label="decrease"
        onPointerDown={() => startHold(-1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
      >
        <Minus size={16} />
      </button>
      <input
        type="number"
        min={1}
        max={999}
        value={qty}
        onChange={(e) => handleInput(e.target.value)}
        onBlur={(e) => {
          const n = parseInt(e.target.value, 10);
          if (isNaN(n) || n < 1) {
            if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null; }
            onRemove(itemId);
          } else {
            schedule(Math.min(n, 999));
          }
        }}
        style={{
          width: 48,
          textAlign: 'center',
          border: 'none',
          background: 'transparent',
          fontWeight: 600,
          fontSize: 15,
          padding: '0 4px',
          WebkitAppearance: 'none',
          MozAppearance: 'textfield',
        }}
      />
      <button
        aria-label="increase"
        onPointerDown={() => startHold(1)}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
      >
        <Plus size={16} />
      </button>
    </div>
  );
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

  // onFlush is called by QtyControl after the debounce settles.
  const onFlush = (itemId: string, qty: number) => {
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
            const serverQty = Number(it.quantity);
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
                  <QtyControl
                    itemId={it.id}
                    serverQty={serverQty}
                    onFlush={onFlush}
                    onRemove={onRemove}
                  />
                  <span style={{ flex: 1, textAlign: 'right', fontWeight: 600 }}>
                    {money(price * serverQty)}
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
