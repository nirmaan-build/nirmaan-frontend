'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Star, X, MessageSquare, Store } from 'lucide-react';

export interface SupplierRow {
  id: string;
  businessName: string;
  isVerified: boolean;
  businessPincode: string | null;
  activeItemCount: number;
  avgRating: number | null;
  reviewCount: number;
}

function ReviewsSheet({
  supplier,
  onClose,
}: {
  supplier: SupplierRow;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 200,
        }}
      />
      {/* Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 201,
          background: 'var(--card)',
          borderRadius: '16px 16px 0 0',
          padding: '20px 20px 32px',
          maxHeight: '65vh',
          overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <strong style={{ fontSize: 16 }}>{supplier.businessName} — Reviews</strong>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}
          >
            <X size={20} />
          </button>
        </div>
        {/* No Review model in schema v2.0 — placeholder empty state */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '32px 0',
            color: 'var(--muted)',
          }}
        >
          <MessageSquare size={36} strokeWidth={1.2} />
          <p style={{ margin: 0, fontSize: 14 }}>No reviews yet for this supplier.</p>
          <p style={{ margin: 0, fontSize: 12, textAlign: 'center' }}>
            Reviews will appear here once buyers rate their orders.
          </p>
        </div>
      </div>
    </>
  );
}

export function SupplierList({
  suppliers,
  slug,
}: {
  suppliers: SupplierRow[];
  slug: string;
}) {
  const [reviewFor, setReviewFor] = useState<SupplierRow | null>(null);

  if (suppliers.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          padding: '48px 0',
          color: 'var(--muted)',
        }}
      >
        <Store size={40} strokeWidth={1.2} />
        <p style={{ margin: 0 }}>No suppliers found in your area for this category.</p>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {suppliers.map((s) => (
          <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, lineHeight: '20px' }}>
                  {s.businessName}
                </p>
                {s.businessPincode && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                    Pincode: {s.businessPincode}
                  </p>
                )}
              </div>
              {s.isVerified && (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--primary)',
                    background: 'var(--primary-tint, color-mix(in srgb, var(--primary) 12%, transparent))',
                    borderRadius: 99,
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <CheckCircle2 size={12} />
                  Verified
                </span>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--muted)' }}>
              <span>{s.activeItemCount} item{s.activeItemCount !== 1 ? 's' : ''}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={12} style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                {s.avgRating !== null ? s.avgRating.toFixed(1) : 'No ratings'}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Link
                href={`/categories/${slug}/${s.id}`}
                style={{ flex: 1 }}
              >
                <button className="primary" style={{ width: '100%' }}>
                  View catalog
                </button>
              </Link>
              <button
                onClick={() => setReviewFor(s)}
                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
              >
                See all reviews
              </button>
            </div>
          </div>
        ))}
      </div>

      {reviewFor && (
        <ReviewsSheet supplier={reviewFor} onClose={() => setReviewFor(null)} />
      )}
    </>
  );
}
