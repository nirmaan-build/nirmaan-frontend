'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Ruler, Check, X, Power, PowerOff } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

interface Translation {
  locale: string;
  name: string;
}
interface Unit {
  id: string;
  name: string;
  shortCode: string;
  isActive: boolean;
  sortOrder: number;
  translations: Translation[];
}
interface UnitRequest {
  id: string;
  rawText: string;
  context: string | null;
  status: string;
}

function hindi(u: Unit): string {
  return u.translations.find((t) => t.locale === 'hi')?.name ?? '';
}

export default function UnitsPage() {
  const router = useRouter();
  const [units, setUnits] = useState<Unit[]>([]);
  const [requests, setRequests] = useState<UnitRequest[]>([]);
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [hindiName, setHindiName] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
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
      const [u, r] = await Promise.all([
        api<Unit[]>('/admin/units'),
        api<UnitRequest[]>('/admin/unit-requests?status=PENDING'),
      ]);
      setUnits(u);
      setRequests(r);
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

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/admin/units', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          shortCode: shortCode.trim(),
          sortOrder: Number(sortOrder) || 0,
          translations: hindiName.trim()
            ? [{ locale: 'hi', name: hindiName.trim() }]
            : [],
        }),
      });
      setName('');
      setShortCode('');
      setHindiName('');
      setSortOrder('0');
      toast.success('Unit added');
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(u: Unit) {
    try {
      await api(`/admin/units/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      toast.success(`${u.name} ${u.isActive ? 'deactivated' : 'activated'}`);
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  async function resolve(
    req: UnitRequest,
    status: 'APPROVED' | 'REJECTED',
    resolvedUnitId?: string,
  ) {
    try {
      await api(`/admin/unit-requests/${req.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          ...(resolvedUnitId ? { resolvedUnitId } : {}),
        }),
      });
      toast.success(`Request ${status.toLowerCase()}`);
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Units &amp; Requests</h1>
        <p className="subtitle">
          The canonical, predefined unit list — the single fix for &ldquo;units
          becoming a mess at scale.&rdquo; New-unit requests from users land in
          the queue below; resolve them by mapping to an existing unit or
          creating a new one.
        </p>
      </div>

      <div className="card">
        <h2>Add a unit</h2>
        <form onSubmit={onCreate}>
          <div className="row">
            <div>
              <label>Name (English)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bag (50kg)"
                required
              />
            </div>
            <div>
              <label>Short code</label>
              <input
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value)}
                placeholder="bag_50kg"
                required
              />
            </div>
            <div>
              <label>Name (Hindi)</label>
              <input
                value={hindiName}
                onChange={(e) => setHindiName(e.target.value)}
                placeholder="बैग"
              />
            </div>
            <div style={{ maxWidth: 130 }}>
              <label>Sort order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
          </div>
          <button className="primary mt" type="submit" disabled={busy}>
            <Plus />
            {busy ? 'Adding…' : 'Add unit'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>All units</h2>
        {units.length === 0 ? (
          <div className="empty">
            <Ruler />
            <span>No units yet. Add your first canonical unit above.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name (EN)</th>
                  <th>Name (HI)</th>
                  <th>Short code</th>
                  <th>Sort</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 550 }}>{u.name}</td>
                    <td>{hindi(u) || <span className="muted">—</span>}</td>
                    <td>
                      <code>{u.shortCode}</code>
                    </td>
                    <td>{u.sortOrder}</td>
                    <td>
                      <span
                        className={`badge ${u.isActive ? 'active' : 'inactive'}`}
                      >
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div
                        style={{ display: 'flex', justifyContent: 'flex-end' }}
                      >
                        <button className="sm" onClick={() => toggleActive(u)}>
                          {u.isActive ? <PowerOff /> : <Power />}
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Pending unit requests</h2>
        {requests.length === 0 ? (
          <div className="empty">
            <Check />
            <span>No pending requests. Users&apos; new-unit asks appear here.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Requested text</th>
                  <th>Context</th>
                  <th>Map to existing unit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <RequestRow
                    key={req.id}
                    req={req}
                    units={units}
                    onResolve={resolve}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function RequestRow({
  req,
  units,
  onResolve,
}: {
  req: UnitRequest;
  units: Unit[];
  onResolve: (
    r: UnitRequest,
    status: 'APPROVED' | 'REJECTED',
    resolvedUnitId?: string,
  ) => void;
}) {
  const [mapTo, setMapTo] = useState('');
  return (
    <tr>
      <td style={{ fontWeight: 550 }}>{req.rawText}</td>
      <td>{req.context || <span className="muted">—</span>}</td>
      <td>
        <select value={mapTo} onChange={(e) => setMapTo(e.target.value)}>
          <option value="">— create new / unspecified —</option>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </td>
      <td>
        <div className="actions" style={{ justifyContent: 'flex-end' }}>
          <button
            className="sm"
            onClick={() => onResolve(req, 'APPROVED', mapTo || undefined)}
          >
            <Check />
            Approve
          </button>
          <button className="danger sm" onClick={() => onResolve(req, 'REJECTED')}>
            <X />
            Reject
          </button>
        </div>
      </td>
    </tr>
  );
}
