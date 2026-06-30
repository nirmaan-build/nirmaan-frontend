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
  ArrowLeft,
  PackageOpen,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { useCart, useRemoveCartItem, useUpdateCartItem, useClearCart } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { money } from '@/lib/format';
import { useNavHistory } from '@/lib/navHistory';
import { SkeletonList } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

function truckIcon(count: number): LucideIcon {
  if (count <= 0) return ShoppingCart;
  if (count <= 5) return Bike;
  if (count <= 15) return Car;
  return Truck;
}

const DEBOUNCE_MS = 700;

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
  const qtyRef = useRef(qty);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!flushTimer.current) { setQty(serverQty); qtyRef.current = serverQty; }
  }, [serverQty]);

  const schedule = useCallback((newQty: number) => {
    setQty(newQty); qtyRef.current = newQty;
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      onFlush(itemId, qtyRef.current);
    }, DEBOUNCE_MS);
  }, [itemId, onFlush]);

  const stopHold = useCallback(() => {
    if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = null; }
    if (holdInterval.current) { clearInterval(holdInterval.current); holdInterval.current = null; }
  }, []);

  const startHold = useCallback((delta: number) => {
    const next = qtyRef.current + delta;
    if (next < 1) {
      if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null; }
      onRemove(itemId); return;
    }
    schedule(Math.min(next, 999));
    holdTimer.current = setTimeout(() => {
      holdInterval.current = setInterval(() => {
        const n = qtyRef.current + delta;
        if (n < 1) { stopHold(); if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null; } onRemove(itemId); return; }
        schedule(Math.min(n, 999));
      }, 80);
    }, 400);
  }, [itemId, onRemove, schedule, stopHold]);

  return (
    <div className="stepper" style={{ flex: 'none' }}>
      <button aria-label="decrease" onPointerDown={() => startHold(-1)} onPointerUp={stopHold} onPointerLeave={stopHold}>
        <Minus size={16} />
      </button>
      <input
        type="number" min={1} max={999} value={qty}
        onChange={(e) => { const n = parseInt(e.target.value, 10); if (!isNaN(n) && e.target.value !== '') schedule(Math.min(Math.max(n, 1), 999)); }}
        onBlur={(e) => { const n = parseInt(e.target.value, 10); if (isNaN(n) || n < 1) { if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null; } onRemove(itemId); } else schedule(Math.min(n, 999)); }}
        style={{ width: 48, textAlign: 'center', border: 'none', background: 'transparent', fontWeight: 600, fontSize: 15, padding: '0 4px', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
      />
      <button aria-label="increase" onPointerDown={() => startHold(1)} onPointerUp={stopHold} onPointerLeave={stopHold}>
        <Plus size={16} />
      </button>
    </div>
  );
}

function EmptyTruckSheet({ open, onConfirm, onCancel, busy }: { open: boolean; onConfirm: () => void; onCancel: () => void; busy: boolean }) {
  const t = useT();
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }} onClick={onCancel}>
      <div style={{ background: 'var(--card)', borderRadius: '20px 20px 0 0', padding: '28px 20px 36px', width: '100%', maxWidth: 520, margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 10px', fontSize: 18 }}>{t('truck.emptyTruckConfirmTitle')}</h3>
        <p style={{ margin: '0 0 24px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>{t('truck.emptyTruckConfirmBody')}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1 }}>{t('truck.emptyTruckNo')}</button>
          <button className="danger" onClick={onConfirm} disabled={busy} style={{ flex: 1, background: 'var(--danger)', color: '#fff', borderColor: 'var(--danger)' }}>
            {busy ? '…' : t('truck.emptyTruckYes')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TruckPage() {
  const router = useRouter();
  const t = useT();
  const { ready } = useAuthGuard();
  const { previous } = useNavHistory();
  const { data, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const [showEmptySheet, setShowEmptySheet] = useState(false);

  if (!ready) return <SkeletonList rows={3} />;

  const count = data?.total_item_count ?? 0;
  const TruckTier = truckIcon(count);

  const onFlush = (itemId: string, qty: number) => { void updateItem.mutateAsync({ itemId, quantity: qty }); };
  const onRemove = (itemId: string) => {
    removeItem.mutate(itemId, {
      onSuccess: () => toast.success(t('truck.remove')),
      onError: () => toast.error(t('common.somethingWrong')),
    });
  };
  const onEmptyConfirm = () => {
    clearCart.mutate(undefined, {
      onSuccess: () => { setShowEmptySheet(false); toast.success('Truck emptied'); },
      onError: () => toast.error(t('common.somethingWrong')),
    });
  };

  return (
    <>
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {previous && previous !== '/truck' && (
          <button
            aria-label={t('common.back')}
            onClick={() => router.push(previous)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--primary)', fontWeight: 500, fontSize: 14, flexShrink: 0 }}
          >
            <ArrowLeft size={16} />{t('common.back')}
          </button>
        )}
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, flex: 1 }}>
          <TruckTier size={26} /> {t('truck.title')}
          {count > 0 && (
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--muted)', marginLeft: 4 }}>
              ({count} {count === 1 ? 'item' : 'items'})
            </span>
          )}
        </h1>
        {/* Empty truck — top-right corner, only when there are items */}
        {count > 0 && (
          <button
            onClick={() => setShowEmptySheet(true)}
            style={{ color: 'var(--danger)', border: '1px solid var(--danger)', background: 'transparent', padding: '6px 12px', minHeight: 36, fontSize: 13, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Trash2 size={14} />
            {t('truck.emptyTruck')}
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonList rows={3} />
      ) : count === 0 ? (
        <EmptyState
          Icon={ShoppingCart}
          title={t('truck.emptyTitle')}
          subtitle={t('truck.emptyBody')}
          action={<button onClick={() => router.push('/categories')}>{t('categories.browseAll')}</button>}
        />
      ) : (
        <>
          {/* ── Item grid (desktop 2-col, mobile 1-col list) ── */}
          <div className="truck-grid">
            {(data?.items ?? []).map((it) => {
              const serverQty = Number(it.quantity);
              const price = it.catalogItem.priceEstimate ? Number(it.catalogItem.priceEstimate) : 0;
              const img = (it.catalogItem as any).imageUrls?.[0] as string | undefined;
              return (
                <div key={it.id} className="truck-item-card">
                  {/* Thumbnail — desktop only */}
                  {img ? (
                    <div className="truck-img">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={it.catalogItem.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div className="truck-img truck-img-placeholder">
                      <PackageOpen size={28} style={{ color: 'var(--muted)', opacity: 0.4 }} />
                    </div>
                  )}
                  {/* Content */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 15, lineHeight: '20px' }}>
                      {it.catalogItem.title}
                    </p>
                    {it.catalogItem.supplier && (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                        {it.catalogItem.supplier.businessName}
                      </p>
                    )}
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                      {money(it.catalogItem.priceEstimate)} / {it.catalogItem.unit.shortCode}
                    </p>
                    {/* Controls row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
                      <QtyControl itemId={it.id} serverQty={serverQty} onFlush={onFlush} onRemove={onRemove} />
                      <span style={{ flex: 1, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>
                        {money(price * serverQty)}
                      </span>
                      <button
                        style={{ flex: 'none', color: 'var(--danger)', minHeight: 0, padding: '6px', border: 'none', background: 'transparent' }}
                        onClick={() => onRemove(it.id)}
                        aria-label={t('truck.remove')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Summary card ── */}
          <div className="card" style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>{t('truck.estimatedValue')}</p>
                <p style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 800 }}>
                  {money(data?.total_estimated_value ?? 0)}
                </p>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                  {t('truck.items', { count })}
                </p>
              </div>
            </div>
          </div>

          {/* ── CTAs ── */}
          <button className="primary" style={{ marginTop: 14 }} onClick={() => router.push('/rfq/new')}>
            {t('truck.sendAsRequirement')} <ArrowRight size={18} />
          </button>
          <button onClick={() => router.push('/callback')} style={{ marginTop: 10, width: '100%' }}>
            <Phone size={18} /> {t('callback.cta')}
          </button>
          <p className="meta" style={{ textAlign: 'center', marginTop: 8 }}>{t('callback.ctaHint')}</p>
        </>
      )}

      <EmptyTruckSheet
        open={showEmptySheet}
        onConfirm={onEmptyConfirm}
        onCancel={() => setShowEmptySheet(false)}
        busy={clearCart.isPending}
      />
    </>
  );
}
