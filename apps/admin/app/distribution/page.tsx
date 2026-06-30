'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  RefreshCcw,
  Search,
  UserPlus,
  X,
  Zap,
} from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────

interface LeadRow {
  id: string;
  source: 'AUTO' | 'MANUAL_ADMIN' | 'FORCE_REBROADCAST';
  distributionRound: number;
  fairnessScore: number | null;
  rankPosition: number | null;
  status: string;
  matchedAt: string;
  viewedAt: string | null;
  supplier: { id: string; businessName: string; isVerified: boolean };
  _count: { quotes: number };
}

interface RfqDetail {
  id: string;
  status: string;
  pincode: string;
  createdAt: string;
  category: { id: string; name: string };
  buyer: { id: string; fullName: string | null; phone: string | null };
  leads: LeadRow[];
}

interface ZeroQuoteRfq {
  id: string;
  status: string;
  pincode: string;
  createdAt: string;
  category: { id: string; name: string };
  buyer: { id: string; fullName: string | null; phone: string | null };
  leads: { id: string; source: string; status: string; distributionRound: number; _count: { quotes: number } }[];
}

interface RfqListItem {
  id: string;
  status: string;
  pincode: string;
  createdAt: string;
  category: { id: string; name: string };
  buyer: { id: string; fullName: string | null };
  _count: { leads: number };
}

interface SupplierOption {
  id: string;
  businessName: string;
  businessPincode: string | null;
  excludedFromAutoDistribution: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function sourceBadge(source: string) {
  const map: Record<string, string> = {
    AUTO: 'badge-auto',
    MANUAL_ADMIN: 'badge-manual',
    FORCE_REBROADCAST: 'badge-rebroadcast',
  };
  const labels: Record<string, string> = {
    AUTO: 'Auto',
    MANUAL_ADMIN: 'Manual',
    FORCE_REBROADCAST: 'Rebroadcast',
  };
  return (
    <span className={`badge ${map[source] ?? ''}`}>{labels[source] ?? source}</span>
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

// ── Sub-components ───────────────────────────────────────────────────────

function DistributionLog({
  rfqId,
  onClose,
}: {
  rfqId: string;
  onClose: () => void;
}) {
  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [supplierQ, setSupplierQ] = useState('');
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierOption | null>(null);
  const [assignBusy, setAssignBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setRfq(await api<RfqDetail>(`/admin/distribution/rfqs/${rfqId}`));
    } catch {
      toast.error('Failed to load distribution log');
    }
  }, [rfqId]);

  useEffect(() => { void load(); }, [load]);

  const rebroadcast = async () => {
    if (!window.confirm('Force a new distribution round for this RFQ?')) return;
    setBusy(true);
    try {
      const r = await api<{ round: number; leadsCreated: number }>(
        `/admin/distribution/rfqs/${rfqId}/rebroadcast`,
        { method: 'POST' },
      );
      toast.success(`Round ${r.round} broadcast to ${r.leadsCreated} new suppliers.`);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rebroadcast failed');
    } finally {
      setBusy(false);
    }
  };

  const searchSuppliers = async (q: string) => {
    setSupplierQ(q);
    if (q.length < 2) { setSupplierOptions([]); return; }
    try {
      const res = await api<SupplierOption[]>(`/admin/distribution/suppliers/search?q=${encodeURIComponent(q)}`);
      setSupplierOptions(res);
    } catch { /* ignore */ }
  };

  const doAssign = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    setAssignBusy(true);
    try {
      await api(`/admin/distribution/rfqs/${rfqId}/manual-assign`, {
        method: 'POST',
        body: JSON.stringify({ supplierId: selectedSupplier.id }),
      });
      toast.success(`Lead manually created for ${selectedSupplier.businessName}.`);
      setShowAssign(false);
      setSelectedSupplier(null);
      setSupplierQ('');
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setAssignBusy(false);
    }
  };

  if (!rfq) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal" style={{ maxWidth: 760 }} onClick={(e) => e.stopPropagation()}>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  const rounds = [...new Set(rfq.leads.map((l) => l.distributionRound))].sort((a, b) => a - b);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: 820, width: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0 }}>Distribution Log</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
              {rfq.category.name} · {rfq.pincode} ·
              Buyer: {rfq.buyer.fullName ?? rfq.buyer.id} ·
              {fmtDate(rfq.createdAt)}
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Action bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <button className="primary" onClick={() => setShowAssign(!showAssign)}>
            <UserPlus size={15} /> Manual Assign
          </button>
          <button onClick={rebroadcast} disabled={busy}>
            <Zap size={15} /> {busy ? 'Broadcasting…' : 'Force Rebroadcast'}
          </button>
          <button onClick={load}>
            <RefreshCcw size={14} /> Refresh
          </button>
        </div>

        {/* Manual Assign form */}
        {showAssign && (
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Manually assign a supplier</h3>
            <form onSubmit={doAssign}>
              <label>Search supplier (by name)</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                <input
                  value={supplierQ}
                  onChange={(e) => void searchSuppliers(e.target.value)}
                  placeholder="Type supplier name…"
                  style={{ paddingLeft: 32 }}
                  autoFocus
                />
              </div>
              {supplierOptions.length > 0 && !selectedSupplier && (
                <div className="dropdown" style={{ position: 'static', boxShadow: 'var(--shadow-lg)' }}>
                  {supplierOptions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => { setSelectedSupplier(s); setSupplierOptions([]); setSupplierQ(s.businessName); }}
                      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                    >
                      {s.businessName}
                      {s.excludedFromAutoDistribution && (
                        <span className="badge badge-manual">Excluded from auto</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {selectedSupplier && (
                <div style={{ padding: '8px 12px', background: 'var(--surface)', borderRadius: 6, marginTop: 8, fontSize: 13 }}>
                  Selected: <strong>{selectedSupplier.businessName}</strong>
                  {selectedSupplier.excludedFromAutoDistribution && (
                    <span className="badge badge-manual" style={{ marginLeft: 8 }}>Excluded from auto</span>
                  )}
                  {' — '}
                  <button type="button" style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => { setSelectedSupplier(null); setSupplierQ(''); }}>
                    Clear
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="primary" type="submit" disabled={!selectedSupplier || assignBusy}>
                  {assignBusy ? 'Assigning…' : 'Assign'}
                </button>
                <button type="button" onClick={() => setShowAssign(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Per-round distribution log */}
        {rfq.leads.length === 0 ? (
          <p className="muted">No leads created yet for this RFQ.</p>
        ) : (
          rounds.map((round) => {
            const roundLeads = rfq.leads.filter((l) => l.distributionRound === round);
            return (
              <div key={round} style={{ marginBottom: 24 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, color: 'var(--primary)' }}>
                  Round {round}
                </h4>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Source</th>
                        <th style={{ textAlign: 'right' }}>Score</th>
                        <th style={{ textAlign: 'right' }}>Rank</th>
                        <th>Lead status</th>
                        <th style={{ textAlign: 'right' }}>Quotes</th>
                        <th>Matched</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roundLeads.map((l) => (
                        <tr key={l.id}>
                          <td>
                            <span style={{ fontWeight: 550 }}>{l.supplier.businessName}</span>
                            {l.supplier.isVerified && (
                              <CheckCircle2 size={13} style={{ marginLeft: 5, color: 'var(--primary)', verticalAlign: 'middle' }} />
                            )}
                          </td>
                          <td>{sourceBadge(l.source)}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                            {l.fairnessScore !== null ? l.fairnessScore.toFixed(4) : '—'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {l.rankPosition !== null ? `#${l.rankPosition}` : '—'}
                          </td>
                          <td>
                            <span className={`badge ${l.status === 'QUOTED' ? 'badge-success' : l.status === 'DECLINED' ? 'badge-danger' : ''}`}>
                              {l.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>{l._count.quotes}</td>
                          <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(l.matchedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────

export default function DistributionPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'queue' | 'rfqs'>('queue');
  const [queue, setQueue] = useState<ZeroQuoteRfq[]>([]);
  const [rfqs, setRfqs] = useState<RfqListItem[]>([]);
  const [rfqTotal, setRfqTotal] = useState(0);
  const [rfqPage, setRfqPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
  const [rebroadcastBusy, setRebroadcastBusy] = useState<string | null>(null);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) { router.push('/login'); return; }
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    },
    [router],
  );

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      setQueue(await api<ZeroQuoteRfq[]>('/admin/distribution/zero-quote-queue'));
    } catch (err) { handleError(err); }
    finally { setLoading(false); }
  }, [handleError]);

  const loadRfqs = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api<{ total: number; rfqs: RfqListItem[] }>(
        `/admin/distribution/rfqs?page=${page}&limit=20`,
      );
      setRfqs(res.rfqs);
      setRfqTotal(res.total);
      setRfqPage(page);
    } catch (err) { handleError(err); }
    finally { setLoading(false); }
  }, [handleError]);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    void loadQueue();
    void loadRfqs(1);
  }, [router, loadQueue, loadRfqs]);

  const quickRebroadcast = async (rfqId: string) => {
    if (!window.confirm('Force a new distribution round for this RFQ?')) return;
    setRebroadcastBusy(rfqId);
    try {
      const r = await api<{ round: number; leadsCreated: number }>(
        `/admin/distribution/rfqs/${rfqId}/rebroadcast`,
        { method: 'POST' },
      );
      toast.success(`Round ${r.round}: ${r.leadsCreated} new lead(s) created.`);
      await loadQueue();
    } catch (err) { handleError(err); }
    finally { setRebroadcastBusy(null); }
  };

  const totalPages = Math.ceil(rfqTotal / 20);

  return (
    <>
      <div className="page-head">
        <h1>Requirement Distribution</h1>
        <p className="subtitle">
          Fairness-scored auto-distribution, zero-quote queue, and admin overrides.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {(['queue', 'rfqs'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px 6px 0 0',
              background: tab === t ? 'var(--surface)' : 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              fontWeight: tab === t ? 700 : 400,
              cursor: 'pointer',
              color: tab === t ? 'var(--foreground)' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {t === 'queue' ? <><AlertCircle size={15} /> Zero-Quote Queue {queue.length > 0 && <span className="badge badge-danger">{queue.length}</span>}</> : <><ClipboardListIcon size={15} /> All RFQs</>}
          </button>
        ))}
      </div>

      {/* ── Tab: Zero-quote queue ─────────────────────────────────────────── */}
      {tab === 'queue' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Zero-Quote Queue</h2>
            <button onClick={loadQueue}><RefreshCcw size={14} /> Refresh</button>
          </div>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : queue.length === 0 ? (
            <div className="empty">
              <CheckCircle2 size={28} />
              <span>All clear — no RFQs past the window without quotes.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Buyer</th>
                    <th>Pincode</th>
                    <th>Posted</th>
                    <th style={{ textAlign: 'right' }}>Leads</th>
                    <th>Rounds</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {queue.map((rfq) => {
                    const rounds = [...new Set(rfq.leads.map((l) => l.distributionRound))];
                    return (
                      <tr key={rfq.id}>
                        <td style={{ fontWeight: 550 }}>{rfq.category.name}</td>
                        <td>{rfq.buyer.fullName ?? '—'}</td>
                        <td>{rfq.pincode}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(rfq.createdAt)}</td>
                        <td style={{ textAlign: 'right' }}>{rfq.leads.length}</td>
                        <td>
                          {rounds.map((r) => (
                            <span key={r} style={{ marginRight: 4, fontSize: 12 }}>R{r}</span>
                          ))}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="primary sm"
                              onClick={() => void quickRebroadcast(rfq.id)}
                              disabled={rebroadcastBusy === rfq.id}
                            >
                              <Zap size={13} />
                              {rebroadcastBusy === rfq.id ? 'Sending…' : 'Force rebroadcast'}
                            </button>
                            <button className="sm" onClick={() => setSelectedRfqId(rfq.id)}>
                              <ChevronRight size={13} /> Log
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: All RFQs ─────────────────────────────────────────────────── */}
      {tab === 'rfqs' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>All Requirements ({rfqTotal})</h2>
            <button onClick={() => void loadRfqs(rfqPage)}><RefreshCcw size={14} /> Refresh</button>
          </div>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : rfqs.length === 0 ? (
            <div className="empty"><Clock size={28} /><span>No RFQs yet.</span></div>
          ) : (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Buyer</th>
                      <th>Pincode</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Leads</th>
                      <th>Posted</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rfqs.map((rfq) => (
                      <tr key={rfq.id}>
                        <td style={{ fontWeight: 550 }}>{rfq.category.name}</td>
                        <td>{rfq.buyer.fullName ?? '—'}</td>
                        <td>{rfq.pincode}</td>
                        <td>
                          <span className={`badge ${rfq.status === 'MATCHED' ? 'badge-success' : rfq.status === 'UNMATCHED' ? 'badge-danger' : ''}`}>
                            {rfq.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>{rfq._count.leads}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(rfq.createdAt)}</td>
                        <td>
                          <button className="sm" onClick={() => setSelectedRfqId(rfq.id)}>
                            <ChevronRight size={13} /> View log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button disabled={rfqPage <= 1} onClick={() => void loadRfqs(rfqPage - 1)}>
                    ← Prev
                  </button>
                  <span style={{ alignSelf: 'center', fontSize: 13 }}>
                    {rfqPage} / {totalPages}
                  </span>
                  <button disabled={rfqPage >= totalPages} onClick={() => void loadRfqs(rfqPage + 1)}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Distribution log modal */}
      {selectedRfqId && (
        <DistributionLog rfqId={selectedRfqId} onClose={() => setSelectedRfqId(null)} />
      )}

      <style>{`
        .badge-auto { background: color-mix(in srgb, var(--primary) 15%, transparent); color: var(--primary); }
        .badge-manual { background: color-mix(in srgb, #f59e0b 15%, transparent); color: #b45309; }
        .badge-rebroadcast { background: color-mix(in srgb, #8b5cf6 15%, transparent); color: #6d28d9; }
        .badge-success { background: color-mix(in srgb, #22c55e 15%, transparent); color: #15803d; }
        .badge-danger { background: color-mix(in srgb, #ef4444 15%, transparent); color: #b91c1c; }
        [data-theme="dark"] .badge-manual { color: #fbbf24; }
        [data-theme="dark"] .badge-rebroadcast { color: #a78bfa; }
        [data-theme="dark"] .badge-success { color: #4ade80; }
        [data-theme="dark"] .badge-danger { color: #f87171; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 100; display: flex; align-items: flex-start; justify-content: center; padding: 40px 16px; overflow-y: auto; }
        .modal { background: var(--card); border-radius: 12px; padding: 28px; width: 100%; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
        .dropdown { background: var(--card); border: 1px solid var(--border); border-radius: 8px; margin-top: 4px; overflow: hidden; }
        .dropdown button { width: 100%; text-align: left; padding: 10px 14px; background: none; border: none; cursor: pointer; font-size: 14px; }
        .dropdown button:hover { background: var(--surface); }
      `}</style>
    </>
  );
}

// Inline icon since ClipboardList isn't imported above
function ClipboardListIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 16h4M8 11h.01M8 16h.01" />
    </svg>
  );
}
