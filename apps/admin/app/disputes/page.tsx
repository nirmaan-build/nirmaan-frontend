'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldAlert, Check } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

const STATUSES = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'] as const;
type Status = (typeof STATUSES)[number];

interface Dispute {
  id: string;
  reason: string;
  description: string | null;
  status: Status;
  resolutionNote: string | null;
  raisedAt: string;
  order: {
    id: string;
    status: string;
    totalAmount: string | number;
    buyer: { fullName: string | null; phone: string | null } | null;
    supplier: { businessName: string } | null;
  } | null;
}

export default function DisputesPage() {
  const router = useRouter();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [draft, setDraft] = useState<Record<string, { status: Status; note: string }>>(
    {},
  );

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

  const load = useCallback(async () => {
    try {
      setDisputes(await api<Dispute[]>('/admin/disputes'));
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    void load();
  }, [router, load]);

  function rowFor(d: Dispute): { status: Status; note: string } {
    return draft[d.id] ?? { status: d.status, note: d.resolutionNote ?? '' };
  }

  async function resolve(d: Dispute) {
    const row = rowFor(d);
    try {
      await api(`/admin/disputes/${d.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: row.status, resolutionNote: row.note || undefined }),
      });
      toast.success('Dispute updated');
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Disputes</h1>
        <p className="subtitle">
          Manual resolution only — no automated rules engine. Resolve with a
          status + a note.
        </p>
      </div>

      <div className="card">
        {disputes.length === 0 ? (
          <div className="empty">
            <ShieldAlert />
            <span>No disputes raised yet.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order / parties</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Resolve</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => {
                  const row = rowFor(d);
                  return (
                    <tr key={d.id}>
                      <td>
                        <span className="muted">{d.order?.id.slice(0, 8)}…</span>
                        <br />
                        {d.order?.buyer?.fullName ?? '—'} ↔{' '}
                        {d.order?.supplier?.businessName ?? '—'}
                      </td>
                      <td>
                        <strong>{d.reason}</strong>
                        {d.description ? (
                          <>
                            <br />
                            <span className="muted">{d.description}</span>
                          </>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            d.status === 'RESOLVED'
                              ? 'active'
                              : d.status === 'REJECTED'
                                ? 'danger'
                                : 'warn'
                          }`}
                        >
                          {d.status.toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <select
                            value={row.status}
                            onChange={(e) =>
                              setDraft((m) => ({
                                ...m,
                                [d.id]: { status: e.target.value as Status, note: row.note },
                              }))
                            }
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          <input
                            value={row.note}
                            placeholder="Resolution note"
                            onChange={(e) =>
                              setDraft((m) => ({
                                ...m,
                                [d.id]: { status: row.status, note: e.target.value },
                              }))
                            }
                          />
                          <button className="primary sm" onClick={() => resolve(d)}>
                            <Check />
                            Save
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
    </>
  );
}
