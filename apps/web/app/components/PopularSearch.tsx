'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PackageOpen } from 'lucide-react';
import { money } from '@/lib/format';
import { useT } from '@/lib/i18n-client';
import { EmptyState } from './EmptyState';
import type { CatalogSearchResult } from '@/lib/types';

type Item = CatalogSearchResult['items'][number];

/** Full popular-items list with a local (client-side) search filter. */
export function PopularSearch({ items }: { items: Item[] }) {
  const t = useT();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return items;
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(needle) ||
        it.supplier?.businessName?.toLowerCase().includes(needle),
    );
  }, [items, q]);

  return (
    <>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 13,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('common.search')}
          style={{ paddingLeft: 40 }}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState Icon={PackageOpen} title={t('home.noItems')} />
      ) : (
        filtered.map((item) => (
          <div key={item.id} className="card">
            <strong>{item.title}</strong>
            <div className="meta">
              {money(item.priceEstimate)} / {item.unit}
              {item.supplier ? `  ·  ${item.supplier.businessName}` : ''}
            </div>
          </div>
        ))
      )}
    </>
  );
}
