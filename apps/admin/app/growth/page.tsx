'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  MapPinned,
  Layers,
  SearchX,
  Filter,
  PackageSearch,
  Download,
  RefreshCw,
} from 'lucide-react';
import { api, ApiError, BASE, getToken, getRole } from '@/lib/api';
const money = (n: number) => '₹' + Number(n ?? 0).toLocaleString('en-IN');

interface AreaRow {
  pincode: string;
  city: string | null;
  state: string | null;
  isServicedNow: boolean;
  searches: number;
  zeroResultSearches: number;
  itemViews: number;
  rfqsPosted: number;
  callbacksRequested: number;
  ordersPlaced: number;
  gmv: number;
  interestCount: number;
}
interface CategoryRow {
  categoryId: string;
  name: string;
  searches: number;
  zeroResultSearches: number;
  itemViews: number;
  rfqsPosted: number;
  ordersPlaced: number;
  gmv: number;
}
interface ZeroRow {
  query: string;
  count: number;
}
interface Funnel {
  itemViews: number;
  rfqsPosted: number;
  callbacksRequested: number;
  ordersPlaced: number;
  gmv: number;
  viewToOrderPct: number;
  intentToOrderPct: number;
}
interface SupplyRow {
  categoryId: string;
  name: string;
  demandScore: number;
  activeItems: number;
  gap: number;
}

export default function GrowthPage() {
  const router = useRouter();
  const role = typeof window !== 'undefined' ? getRole() : null;

  // The expansion shortlist (non-serviced) is the most important view, so it's
  // the default for the Demand-by-Area centerpiece.
  const [areaView, setAreaView] = useState<'serviced' | 'non-serviced'>(
    'non-serviced',
  );
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [zero, setZero] = useState<ZeroRow[]>([]);
  const [funnel, setFunnel] = useState<Funnel | null>(null);
  const [supply, setSupply] = useState<SupplyRow[]>([]);
  const [busy, setBusy] = useState(false);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    },
    [router],
  );

  const loadArea = useCallback(
    async (view: 'serviced' | 'non-serviced') => {
      try {
        const serviceable = view === 'serviced';
        setAreas(
          await api<AreaRow[]>(
            `/admin/analytics/demand-by-area?serviceable=${serviceable}`,
          ),
        );
      } catch (err) {
        handleError(err);
      }
    },
    [handleError],
  );

  const loadRest = useCallback(async () => {
    try {
      const [c, z, f, s] = await Promise.all([
        api<CategoryRow[]>('/admin/analytics/demand-by-category'),
        api<ZeroRow[]>('/admin/analytics/zero-result-searches'),
        api<Funnel>('/admin/analytics/funnel'),
        api<SupplyRow[]>('/admin/analytics/supply-vs-demand'),
      ]);
      setCategories(c);
      setZero(z);
      setFunnel(f);
      setSupply(s);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    void loadArea(areaView);
    void loadRest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (getToken()) void loadArea(areaView);
  }, [areaView, loadArea]);

  const maxAreaMetric = useMemo(() => {
    const vals = areas.map((a) =>
      areaView === 'serviced' ? a.gmv : a.interestCount + a.searches,
    );
    return Math.max(1, ...vals);
  }, [areas, areaView]);

  async function runRollup() {
    setBusy(true);
    try {
      const r = await api<{ dates: string[] }>('/admin/analytics/rollup', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast.success(`Rollup done for ${r.dates.join(', ')}`);
      await loadArea(areaView);
      await loadRest();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function downloadExport(dataset: 'area' | 'category' | 'zero-results') {
    try {
      const res = await fetch(
        `${BASE}/admin/analytics/export?dataset=${dataset}`,
        { headers: { Authorization: `Bearer ${getToken() ?? ''}` } },
      );
      if (!res.ok) {
        toast.error(res.status === 403 ? 'Export is SUPER_ADMIN only' : 'Export failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nirmaan-${dataset}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed');
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Growth Intelligence</h1>
        <p className="subtitle">
          Where demand is, where supply isn&apos;t, and where to expand next.
          Reads the daily rollup cache; zero-result mining hits raw logs.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {(role === 'SUPER_ADMIN' || role === 'OPS') && (
          <button className="sm" onClick={runRollup} disabled={busy}>
            <RefreshCw size={15} /> Run rollup now
          </button>
        )}
        {role === 'SUPER_ADMIN' && (
          <>
            <button className="sm" onClick={() => downloadExport('area')}>
              <Download size={15} /> Export area CSV
            </button>
            <button className="sm" onClick={() => downloadExport('category')}>
              <Download size={15} /> Export category CSV
            </button>
          </>
        )}
      </div>

      {/* Centerpiece: Demand-by-Area with the serviced / non-serviced toggle */}
      <div className="card">
        <div className="card-head">
          <h2>
            <MapPinned size={16} style={{ verticalAlign: '-3px', marginRight: 7 }} />
            Demand by area
            {areaView === 'non-serviced' ? ' — expansion shortlist' : ''}
          </h2>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={areaView === 'serviced' ? 'primary sm' : 'sm'}
              onClick={() => setAreaView('serviced')}
            >
              Serviced
            </button>
            <button
              className={areaView === 'non-serviced' ? 'primary sm' : 'sm'}
              onClick={() => setAreaView('non-serviced')}
            >
              Non-serviced
            </button>
          </div>
        </div>

        {areas.length === 0 ? (
          <div className="empty">
            <Filter />
            <span>
              No {areaView} demand in range yet. Run the rollup after generating
              some activity.
            </span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>{areaView === 'serviced' ? 'GMV' : 'Interest'}</th>
                  <th>Searches</th>
                  <th>Zero-result</th>
                  <th>Views</th>
                  <th>RFQs</th>
                  <th>{areaView === 'serviced' ? 'Orders' : 'Callbacks'}</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((a) => {
                  const metric =
                    areaView === 'serviced' ? a.gmv : a.interestCount + a.searches;
                  const pctWidth = Math.round((metric / maxAreaMetric) * 100);
                  return (
                    <tr key={a.pincode}>
                      <td>
                        <strong>{a.city ?? a.pincode}</strong>
                        <br />
                        <span className="muted">{a.pincode}</span>
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div
                          style={{
                            background: 'var(--primary, #2563eb)',
                            height: 8,
                            borderRadius: 4,
                            width: `${pctWidth}%`,
                            minWidth: 4,
                            marginBottom: 4,
                          }}
                        />
                        <strong>
                          {areaView === 'serviced'
                            ? money(a.gmv)
                            : a.interestCount + a.searches}
                        </strong>
                      </td>
                      <td>{a.searches}</td>
                      <td>{a.zeroResultSearches}</td>
                      <td>{a.itemViews}</td>
                      <td>{a.rfqsPosted}</td>
                      <td>
                        {areaView === 'serviced' ? a.ordersPlaced : a.callbacksRequested}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Geographic heat-map rendering needs a tiles library + pincode
          centroids (PostGIS) — flagged for later; this ranked view uses the same
          rollup data.
        </p>
      </div>

      {/* Conversion funnel */}
      {funnel && (
        <div className="card">
          <div className="card-head">
            <h2>Conversion funnel</h2>
            <span className="badge">{funnel.viewToOrderPct}% view → order</span>
          </div>
          <div className="stat-grid">
            {[
              { label: 'Item views', value: funnel.itemViews },
              { label: 'RFQs posted', value: funnel.rfqsPosted },
              { label: 'Callbacks', value: funnel.callbacksRequested },
              { label: 'Orders placed', value: funnel.ordersPlaced },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            GMV {money(funnel.gmv)} · intent → order {funnel.intentToOrderPct}%
          </p>
        </div>
      )}

      {/* Supply vs demand */}
      <div className="card">
        <div className="card-head">
          <h2>
            <PackageSearch size={16} style={{ verticalAlign: '-3px', marginRight: 7 }} />
            Supply vs demand
          </h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Demand score</th>
                <th>Active items</th>
                <th>Gap</th>
              </tr>
            </thead>
            <tbody>
              {supply.map((s) => (
                <tr key={s.categoryId}>
                  <td>{s.name}</td>
                  <td>{s.demandScore}</td>
                  <td>{s.activeItems}</td>
                  <td>
                    <span className={`badge ${s.gap > 0 ? 'warn' : 'active'}`}>
                      {s.gap > 0 ? `recruit (+${s.gap})` : 'covered'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demand by category + zero-result searches side by side */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <div className="card-head">
            <h2>
              <Layers size={16} style={{ verticalAlign: '-3px', marginRight: 7 }} />
              Demand by category
            </h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Views</th>
                  <th>RFQs</th>
                  <th>GMV</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.categoryId}>
                    <td>{c.name}</td>
                    <td>{c.itemViews}</td>
                    <td>{c.rfqsPosted}</td>
                    <td>{money(c.gmv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 280 }}>
          <div className="card-head">
            <h2>
              <SearchX size={16} style={{ verticalAlign: '-3px', marginRight: 7 }} />
              Zero-result searches
            </h2>
            {role === 'SUPER_ADMIN' && (
              <button className="sm" onClick={() => downloadExport('zero-results')}>
                <Download size={15} /> CSV
              </button>
            )}
          </div>
          {zero.length === 0 ? (
            <div className="empty">
              <SearchX />
              <span>No unmet searches in range.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Query</th>
                    <th>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {zero.map((z) => (
                    <tr key={z.query}>
                      <td>{z.query}</td>
                      <td>{z.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
