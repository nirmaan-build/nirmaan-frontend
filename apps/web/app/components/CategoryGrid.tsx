'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Search, X } from 'lucide-react';
import type { Category } from '@/lib/types';

/** Client-side filterable category chip grid. Replaces the global API SearchBox on /categories. */
export function CategoryGrid({ categories }: { categories: Category[] }) {
  const [q, setQ] = useState('');
  const filtered = q.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()))
    : categories;

  return (
    <>
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter categories…"
          style={{ paddingLeft: 36, paddingRight: q ? 32 : 12 }}
          autoComplete="off"
        />
        {q ? (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Clear filter"
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              padding: 3,
              cursor: 'pointer',
              color: 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <p className="muted">No matching categories.</p>
      ) : (
        <div className="grid">
          {filtered.map((c) => (
            <Link key={c.id} href={`/categories/${c.id}`} className="chip">
              <span className="ic">
                <Package size={22} />
              </span>
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
