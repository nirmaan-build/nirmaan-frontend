'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAddToCart, useCart, useRemoveCartItem, useUpdateCartItem } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { getToken } from '@/lib/cookies';

const DEBOUNCE_MS = 700;

/**
 * "Add to Truck" for a catalog item shown in category grids.
 * - Before adding: single "Add to Truck" button.
 * - After adding: inline +/- stepper with local optimistic qty (instant feedback).
 *   A single debounced API call is made after DEBOUNCE_MS of idle to avoid
 *   hitting the backend on every tap (PRD-01 cart operations).
 */
export function AddToTruck({ catalogItemId }: { catalogItemId: string }) {
  const router = useRouter();
  const t = useT();
  const { data: cart } = useCart();
  const addToCart = useAddToCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  // Find this item in the cart (if present)
  const cartItem = cart?.items.find((ci) => ci.catalogItem.id === catalogItemId);
  const serverQty = cartItem ? Number(cartItem.quantity) : 0;

  // Local qty for instant visual feedback; synced from server when no flush is pending.
  const [localQty, setLocalQty] = useState(serverQty);
  const localQtyRef = useRef(localQty);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from server cart data (only when no debounce is pending).
  useEffect(() => {
    if (!flushTimer.current) {
      setLocalQty(serverQty);
      localQtyRef.current = serverQty;
    }
  }, [serverQty]);

  const scheduleFlush = (newQty: number, cartItemId: string) => {
    setLocalQty(newQty);
    localQtyRef.current = newQty;
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      void updateItem.mutateAsync({ itemId: cartItemId, quantity: localQtyRef.current });
    }, DEBOUNCE_MS);
  };

  const onAdd = async () => {
    if (!getToken()) { router.push('/login'); return; }
    try {
      await addToCart.mutateAsync({ catalogItemId, quantity: 1 });
      toast.success(t('itemDetail.added'), {
        action: { label: t('truck.tabLabel'), onClick: () => router.push('/truck') },
      });
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  const onDecrement = () => {
    if (!cartItem) return;
    const next = localQtyRef.current - 1;
    if (next < 1) {
      // Cancel pending flush — remove replaces any pending update.
      if (flushTimer.current) { clearTimeout(flushTimer.current); flushTimer.current = null; }
      setLocalQty(0);
      localQtyRef.current = 0;
      removeItem.mutate(cartItem.id, {
        onError: () => toast.error(t('common.somethingWrong')),
      });
    } else {
      scheduleFlush(next, cartItem.id);
    }
  };

  const onIncrement = () => {
    if (!cartItem) return;
    scheduleFlush(Math.min(localQtyRef.current + 1, 999), cartItem.id);
  };

  if (localQty > 0 && cartItem) {
    return (
      <div
        className="stepper"
        style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 2 }}
      >
        <button
          onClick={onDecrement}
          aria-label="Decrease"
          style={{ minWidth: 32, minHeight: 32 }}
        >
          <Minus size={14} />
        </button>
        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>
          {localQty}
        </span>
        <button
          onClick={onIncrement}
          aria-label="Increase"
          style={{ minWidth: 32, minHeight: 32 }}
        >
          <Plus size={14} />
        </button>
      </div>
    );
  }

  return (
    <button onClick={onAdd} disabled={addToCart.isPending}>
      <Plus size={16} />
      {t('categoryPage.addToTruck')}
    </button>
  );
}
