'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Package, X } from 'lucide-react';
import { useSuggest } from '@/lib/queries';
import { useDebounce } from '@/lib/useDebounce';
import { useLocale, useT } from '@/lib/i18n-client';
import { getUser } from '@/lib/cookies';
import type { Suggestion } from '@/lib/types';

export function SearchBox({ placeholder }: { placeholder?: string }) {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const pincode = getUser()?.primaryPincode ?? '';

  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const debouncedQ = useDebounce(q, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Only fire the suggest API when the user has typed ≥2 chars AND has a pincode.
  // Passing an empty string triggers a backend call for every keystroke — wasteful.
  const shouldFetch = debouncedQ.length >= 2 && !!pincode;
  const { data, isFetching } = useSuggest(
    shouldFetch ? debouncedQ : '',
    pincode,
    locale,
  );
  const suggestions = data?.suggestions ?? [];

  // Click-outside closes the dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (s: Suggestion) => {
    setOpen(false);
    setQ(s.label);
    if (s.type === 'category') {
      router.push(`/categories/${s.id}`);
    } else {
      // Item → go to its category page with search query pre-filled
      // (no item-detail route on web per PRD-03 §4.1)
      router.push(`/categories?q=${encodeURIComponent(s.label)}`);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/categories?q=${encodeURIComponent(q.trim())}`);
  };

  const clear = () => {
    setQ('');
    inputRef.current?.focus();
  };

  const showDropdown = open && pincode && (suggestions.length > 0 || isFetching);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <form onSubmit={onSubmit}>
        <div style={{ position: 'relative' }}>
          <Search
            size={17}
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
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder ?? t('common.search')}
            style={{ paddingLeft: 40, paddingRight: q ? 36 : 12 }}
            autoComplete="off"
          />
          {q ? (
            <button
              type="button"
              onClick={clear}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                padding: 2,
                cursor: 'pointer',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
      </form>

      {showDropdown ? (
        <div className="dropdown" style={{ position: 'absolute', width: '100%', zIndex: 50 }}>
          {isFetching && suggestions.length === 0 ? (
            <div style={{ padding: '10px 14px', color: 'var(--muted)', fontSize: 13 }}>
              Searching…
            </div>
          ) : (
            suggestions.map((s) => (
              <button
                key={`${s.type}-${s.id}`}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(s); }}
              >
                <span style={{ color: 'var(--muted)', display: 'flex', flexShrink: 0 }}>
                  {s.type === 'category' ? <Package size={16} /> : <Search size={16} />}
                </span>
                <span style={{ flex: 1, textAlign: 'left' }}>{s.label}</span>
                {s.supplierCount !== undefined && s.supplierCount > 0 ? (
                  <span className="muted" style={{ fontSize: 12 }}>
                    {s.supplierCount} supplier{s.supplierCount > 1 ? 's' : ''}
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
