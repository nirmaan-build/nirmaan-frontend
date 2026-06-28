'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ClipboardList, Check, X, RefreshCcw } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

type RfqStatus = 'OPEN' | 'MATCHED' | 'UNMATCHED' | 'QUOTED' | 'CLOSED' | 'EXPIRED';

interface RfqRow {
  id: string;
  status: RfqStatus;
  description: string;
  quantity: string | number;
  pincode: string;
  createdAt: string;
  buyer: { id: string; fullName: string | null; email: string; phone: string | null };
  category: { id: string; slug: string };
  unit: { id: string; name: string; shortCode: string };
  _count: { leads: number };
}

const STATUS_COLORS: Record<RfqStatus, string> = {
  OPEN: 'active',
  MATCHED: 'active',
  UNMATCHED: 'warn',
  QUOTED: 'active',
  CLOSED: 'inactive',
  EXPIRED: 'inactive',
};

const ALL_STATUSES: RfqStatus[] = ['OPEN', 'MATCHED', 'UNMATCHED', 'QUOTED', 'CLOSED', 'EXPIRED'];

export default function RfqsPage() {
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RfqRow[]>([]);
  const [filter, setFilter] = useState<RfqStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const qs = status ? `?status=${status}` : '';
      const data = await api<RfqRow[]>(`/admin/rfqs${qs}`);
      setRfqs(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.push('/login');
      else toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    void load(filter || undefined);
  }, [router, load, filter]);

  async function updateStatus(rfq: RfqRow, status: RfqStatus) {
    setBusy(rfq.id + status);
    try {
      await api(`/admin/rfqs/${rfq.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      toast.success(`Requirement ${status.toLowerCase()}`);
      await load(filter || undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Requirements</h1>
        <p className="subtitle">
          Buyer-posted requirements (RFQs). Accept keeps the requirement live
          for matching; closing it removes it from the active queue. Supplier
          actions will plug into the same endpoint in a future stage.
        </p>
      </div>

      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap' }}>
          <button
            className={filter === '' ? 'primary sm' : 'sm'}
            onClick={() => setFilter('')}
          >
            All
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              className={filter === s ? 'primary sm' : 'sm'}
              onClick={() => setFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <button className="sm" onClick={() => load(filter || undefined)} disabled={loading}>
          <RefreshCcw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      <div className="card">
        {rfqs.length === 0 && !loading ? (
          <div className="empty">
            <ClipboardList />
            <span>No requirements{filter ? ` with status ${filter}` : ''} yet.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty / Unit</th>
                  <th>Buyer</th>
                  <th>Pincode</th>
                  <th>Leads</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rfqs.map((r) => (
                  <tr key={r.id}>
                    <td style={{ maxWidth: 260 }}>
                      <span style={{ fontWeight: 550 }}>{r.description}</span>
                      <br />
                      <span className="muted" style={{ fontSize: 12 }}>{r.category.slug}</span>
                    </td>
                    <td>
                      {Number(r.quantity).toLocaleString('en-IN')}{' '}
                      <span className="muted">{r.unit.shortCode}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 550 }}>{r.buyer.fullName ?? '—'}</span>
                      <br />
                      <span className="muted" style={{ fontSize: 12 }}>{r.buyer.phone ?? r.buyer.email}</span>
                    </td>
                    <td>{r.pincode}</td>
                    <td style={{ textAlign: 'center' }}>{r._count.leads}</td>
                    <td>
                      <span className={`badge ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: 'var(--muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td>
                      <div className="actions" style={{ justifyContent: 'flex-end' }}>
                        {r.status !== 'CLOSED' && r.status !== 'EXPIRED' && (
                          <button
                            className="danger sm"
                            disabled={busy === r.id + 'CLOSED'}
                            onClick={() => updateStatus(r, 'CLOSED')}
                          >
                            <X size={14} />
                            Close
                          </button>
                        )}
                        {(r.status === 'CLOSED' || r.status === 'EXPIRED') && (
                          <button
                            className="sm"
                            disabled={busy === r.id + 'OPEN'}
                            onClick={() => updateStatus(r, 'OPEN')}
                          >
                            <Check size={14} />
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
