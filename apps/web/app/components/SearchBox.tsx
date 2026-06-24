'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package } from 'lucide-react';
import { useSuggest } from '@/lib/queries';
import { useLocale, useT } from '@/lib/i18n-client';
import { getUser } from '@/lib/cookies';
import type { Suggestion } from '@/lib/types';

export function SearchBox({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const pincode = getUser()?.primaryPincode ?? '';
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const { data } = useSuggest(q, pincode, locale);
  const suggestions = data?.suggestions ?? [];

  const pick = (s: Suggestion) => {
    setFocused(false);
    if (s.type === 'category') router.push(`/categories/${s.id}`);
    else router.push('/categories'); // no item-detail route on web (PRD-03 §4.1)
  };

  return (
    <div>
      <div style={{ position: 'relative' }}>
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
          onFocus={() => setFocused(true)}
          placeholder={placeholder ?? t('common.search')}
          style={{ paddingLeft: 40 }}
        />
      </div>
      {focused && suggestions.length > 0 ? (
        <div className="dropdown">
          {suggestions.map((s) => (
            <button key={`${s.type}-${s.id}`} onClick={() => pick(s)}>
              <span style={{ color: 'var(--muted)', display: 'flex' }}>
                {s.type === 'category' ? <Package size={17} /> : <Search size={17} />}
              </span>
              <span style={{ flex: 1 }}>{s.label}</span>
              {s.supplierCount !== undefined ? (
                <span className="muted">{s.supplierCount}</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
