'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAddToCart } from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { getToken } from '@/lib/cookies';

export function AddToTruck({ catalogItemId }: { catalogItemId: string }) {
  const router = useRouter();
  const t = useT();
  const addToCart = useAddToCart();
  const [added, setAdded] = useState(false);

  const onAdd = async () => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    try {
      await addToCart.mutateAsync({ catalogItemId, quantity: 1 });
      setAdded(true);
      // Mirrors the mobile add-to-truck toast with a jump-to-Truck action.
      toast.success(t('itemDetail.added'), {
        action: { label: t('truck.tabLabel'), onClick: () => router.push('/truck') },
      });
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  return (
    <button onClick={onAdd} disabled={addToCart.isPending}>
      {added ? <Check size={16} /> : <Plus size={16} />}
      {added ? t('itemDetail.added') : t('categoryPage.addToTruck')}
    </button>
  );
}
