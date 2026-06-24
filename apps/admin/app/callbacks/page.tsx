'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PhoneCall, UserCheck, PhoneForwarded, Link2, Check } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

const STATUSES = [
  'PENDING',
  'CONTACTED',
  'CART_UPDATED',
  'LINK_SENT',
  'COMPLETED',
  'CANCELLED',
] as const;
type Status = (typeof STATUSES)[number];

interface CallbackListRow {
  id: string;
  status: Status;
  preferredPhone: string;
  note: string | null;
  createdAt: string;
  buyer: { id: string; fullName: string | null; phone: string | null } | null;
  _count: { items: number };
}

interface CallbackItem {
  id: string;
  quantity: string | number;
  wasModifiedByTeam: boolean;
  catalogItem: {
    id: string;
    title: string;
    priceEstimate: string | number | null;
    unit: { name: string; shortCode: string } | null;
    supplier: { id: string; businessName: string } | null;
  };
}
interface PaymentLink {
  id: string;
  url: string;
  amount: string | number;
  status: string;
  createdAt: string;
}
interface CallbackDetail extends CallbackListRow {
  items: CallbackItem[];
  paymentLinks: PaymentLink[];
  order: { id: string; status: string } | null;
}

const money = (n: string | number | null | undefined) =>
  '₹' + Number(n ?? 0).toLocaleString('en-IN');

function badgeClass(status: Status): string {
  if (status === 'COMPLETED') return 'active';
  if (status === 'CANCELLED') return 'danger';
  return 'warn';
}

export default function CallbacksPage() {
  const router = useRouter();
  const [rows, setRows] = useState<CallbackListRow[]>([]);
  const [selected, setSelected] = useState<CallbackDetail | null>(null);
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});
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

  const load = useCallback(async () => {
    try {
      setRows(await api<CallbackListRow[]>('/admin/callbacks'));
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  const openDetail = useCallback(
    async (id: string) => {
      try {
        const detail = await api<CallbackDetail>(`/admin/callbacks/${id}`);
        setSelected(detail);
        setQtyDraft(
          Object.fromEntries(
            detail.items.map((it) => [it.id, String(Number(it.quantity))]),
          ),
        );
      } catch (err) {
        handleError(err);
      }
    },
    [handleError],
  );

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    void load();
  }, [router, load]);

  async function act(
    path: string,
    method: 'PATCH' | 'POST',
    body?: unknown,
    okMsg = 'Done',
  ) {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/admin/callbacks/${selected.id}${path}`, {
        method,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      toast.success(okMsg);
      await load();
      await openDetail(selected.id);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  const detailTotal = selected
    ? selected.items.reduce(
        (sum, it) =>
          sum +
          Number(it.catalogItem.priceEstimate ?? 0) *
            Number(qtyDraft[it.id] ?? it.quantity),
        0,
      )
    : 0;

  const saveItems = () => {
    if (!selected) return;
    const items = selected.items.map((it) => ({
      itemId: it.id,
      quantity: Number(qtyDraft[it.id] ?? it.quantity),
    }));
    void act('/items', 'PATCH', { items }, 'Quantities updated');
  };

  return (
    <>
      <div className="page-head">
        <h1>Callback Requests</h1>
        <p className="subtitle">
          The concierge queue. Call the buyer, adjust quantities to match what
          you agreed, then generate a payment link.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Queue */}
        <div className="card" style={{ flex: 1 }}>
          {rows.length === 0 ? (
            <div className="empty">
              <PhoneCall />
              <span>No callback requests yet.</span>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Buyer</th>
                    <th>Items</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        {r.buyer?.fullName ?? '—'}
                        <br />
                        <span className="muted">{r.preferredPhone}</span>
                      </td>
                      <td>{r._count.items}</td>
                      <td>
                        <span className={`badge ${badgeClass(r.status)}`}>
                          {r.status.toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <button className="sm" onClick={() => openDetail(r.id)}>
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Working detail */}
        {selected ? (
          <div className="card" style={{ flex: 1 }}>
            <div className="page-head" style={{ marginBottom: 8 }}>
              <h1 style={{ fontSize: 18 }}>
                {selected.buyer?.fullName ?? '—'}{' '}
                <span className={`badge ${badgeClass(selected.status)}`}>
                  {selected.status.toLowerCase()}
                </span>
              </h1>
              <p className="subtitle">
                Call {selected.preferredPhone}
                {selected.note ? ` · “${selected.note}”` : ''}
              </p>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items.map((it) => (
                    <tr key={it.id}>
                      <td>
                        {it.catalogItem.title}
                        {it.wasModifiedByTeam ? (
                          <span className="badge warn" style={{ marginLeft: 6 }}>
                            edited
                          </span>
                        ) : null}
                        <br />
                        <span className="muted">
                          {it.catalogItem.supplier?.businessName ?? '—'} ·{' '}
                          {it.catalogItem.unit?.name ?? ''}
                        </span>
                      </td>
                      <td>{money(it.catalogItem.priceEstimate)}</td>
                      <td>
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          style={{ width: 80 }}
                          value={qtyDraft[it.id] ?? ''}
                          disabled={selected.status === 'COMPLETED'}
                          onChange={(e) =>
                            setQtyDraft((m) => ({ ...m, [it.id]: e.target.value }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="row"
              style={{ justifyContent: 'space-between', marginTop: 12 }}
            >
              <strong>Total</strong>
              <strong>{money(detailTotal)}</strong>
            </div>

            {selected.paymentLinks.length > 0 ? (
              <div className="muted" style={{ marginTop: 12, fontSize: 13 }}>
                Latest link: {selected.paymentLinks[0].status.toLowerCase()} —{' '}
                <a href={selected.paymentLinks[0].url} target="_blank" rel="noreferrer">
                  open
                </a>
              </div>
            ) : null}
            {selected.order ? (
              <div className="badge active" style={{ marginTop: 12 }}>
                Order {selected.order.id.slice(0, 8)}… · {selected.order.status.toLowerCase()}
              </div>
            ) : null}

            <div
              style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}
            >
              <button
                className="sm"
                disabled={busy}
                onClick={() => act('/assign', 'PATCH', undefined, 'Assigned to you')}
              >
                <UserCheck /> Assign to me
              </button>
              <button
                className="sm"
                disabled={busy}
                onClick={() =>
                  act('/contacted', 'PATCH', undefined, 'Marked contacted')
                }
              >
                <PhoneForwarded /> Mark contacted
              </button>
              <button
                className="sm"
                disabled={busy || selected.status === 'COMPLETED'}
                onClick={saveItems}
              >
                <Check /> Save quantities
              </button>
              <button
                className="primary sm"
                disabled={busy || selected.status === 'COMPLETED'}
                onClick={() =>
                  act('/payment-link', 'POST', undefined, 'Payment link sent')
                }
              >
                <Link2 /> Generate payment link
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ flex: 1 }}>
            <div className="empty">
              <PhoneCall />
              <span>Select a request to work on it.</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
