'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, MapPinned, SearchX, Percent } from 'lucide-react';
import { api } from '@/lib/api';

interface Headline {
  topServicedAreaByGmv: { pincode: string; city: string | null; gmv: number } | null;
  topNonServicedAreaByInterest: {
    pincode: string;
    city: string | null;
    interest: number;
  } | null;
  topZeroResultSearch: { query: string; count: number } | null;
  viewToOrderPct: number;
}

const money = (n: number) => '₹' + Number(n ?? 0).toLocaleString('en-IN');

/** "Demand this week" strip (PRD-04 §5.14) — the four signals that matter most. */
export function HeadlineStrip() {
  const [data, setData] = useState<Headline | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<Headline>('/admin/analytics/headline')
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return null;

  const serviced = data?.topServicedAreaByGmv;
  const nonServiced = data?.topNonServicedAreaByInterest;
  const zero = data?.topZeroResultSearch;

  const cards = [
    {
      label: 'Top serviced area (GMV)',
      value: serviced ? money(serviced.gmv) : '—',
      sub: serviced ? `${serviced.city ?? serviced.pincode}` : 'No orders yet',
      icon: TrendingUp,
      tone: 'green',
    },
    {
      label: 'Top non-serviced area',
      value: nonServiced ? String(nonServiced.interest) : '—',
      sub: nonServiced
        ? `${nonServiced.city ?? nonServiced.pincode} · interest signals`
        : 'No demand outside coverage',
      icon: MapPinned,
      tone: 'amber',
    },
    {
      label: 'Top zero-result search',
      value: zero ? `“${zero.query}”` : '—',
      sub: zero ? `${zero.count} searches, nothing found` : 'No gaps this week',
      icon: SearchX,
      tone: 'red',
    },
    {
      label: 'View → order conversion',
      value: data ? `${data.viewToOrderPct}%` : '—',
      sub: 'Across all areas, last 7 days',
      icon: Percent,
      tone: 'blue',
    },
  ] as const;

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-head">
        <h2>
          <TrendingUp size={16} style={{ verticalAlign: '-3px', marginRight: 7 }} />
          Demand this week
        </h2>
        <Link href="/growth" className="badge" style={{ textTransform: 'none' }}>
          Open Growth Intelligence →
        </Link>
      </div>
      <div className="stat-grid">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div className="stat-card" key={c.label}>
              <div className="stat-top">
                <span className="stat-label">{c.label}</span>
                <span className={`stat-ico ${c.tone}`}>
                  <Icon />
                </span>
              </div>
              <div className="stat-value" style={{ fontSize: 20 }}>
                {c.value}
              </div>
              <div className="stat-sub">{c.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
