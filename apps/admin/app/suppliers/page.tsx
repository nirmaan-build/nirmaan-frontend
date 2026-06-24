'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Store, BadgeCheck, BadgeX, Ban } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

interface Supplier {
  id: string;
  businessName: string;
  gstNumber: string | null;
  status: string;
  isVerified: boolean;
  user: { fullName: string | null; email: string | null; phone: string | null };
  serviceAreas: { pincode: string }[];
  categories: { categoryId: string }[];
}

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

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
      setSuppliers(await api<Supplier[]>('/admin/suppliers'));
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

  const act = async (
    s: Supplier,
    action: 'verify' | 'unverify' | 'suspend',
  ) => {
    if (action === 'suspend' && !window.confirm(`Suspend "${s.businessName}"?`))
      return;
    try {
      await api(`/admin/suppliers/${s.id}/${action}`, { method: 'PATCH' });
      const msg =
        action === 'verify'
          ? 'Supplier verified'
          : action === 'unverify'
            ? 'Verification removed'
            : 'Supplier suspended';
      toast.success(msg);
      await load();
    } catch (err) {
      handleError(err);
    }
  };

  const [la, setLa] = useState<Record<string, string>>({});
  const checkLa = async (s: Supplier) => {
    try {
      const res = await api<{ configured: boolean; status: string }>(
        `/admin/suppliers/${s.id}/razorpay`,
      );
      setLa((m) => ({
        ...m,
        [s.id]: res.configured ? res.status : 'not configured',
      }));
    } catch (err) {
      handleError(err);
    }
  };

  const statusClass = (s: Supplier) =>
    s.status === 'SUSPENDED' ? 'danger' : s.isVerified ? 'active' : 'warn';

  return (
    <>
      <div className="page-head">
        <h1>Suppliers &amp; Verification</h1>
        <p className="subtitle">
          v1 verification is manual. Verifying a supplier sets the “Verified”
          badge and includes them in RFQ matching.
        </p>
      </div>

      <div className="card">
        {suppliers.length === 0 ? (
          <div className="empty">
            <Store />
            <span>No suppliers have registered yet.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Contact</th>
                  <th>GST</th>
                  <th>Areas</th>
                  <th>Cats</th>
                  <th>Status</th>
                  <th>Razorpay LA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 550 }}>{s.businessName}</td>
                    <td>
                      {s.user.fullName ?? '—'}
                      <br />
                      <span className="muted">
                        {s.user.email ?? s.user.phone ?? ''}
                      </span>
                    </td>
                    <td>{s.gstNumber ?? <span className="muted">—</span>}</td>
                    <td>{s.serviceAreas.length}</td>
                    <td>{s.categories.length}</td>
                    <td>
                      <span className={`badge ${statusClass(s)}`}>
                        {s.status.toLowerCase()}
                      </span>
                    </td>
                    <td>
                      {la[s.id] ? (
                        <span className="badge">{la[s.id]}</span>
                      ) : (
                        <button className="sm" onClick={() => checkLa(s)}>
                          Check
                        </button>
                      )}
                    </td>
                    <td>
                      <div className="actions" style={{ justifyContent: 'flex-end' }}>
                        {s.isVerified ? (
                          <button className="sm" onClick={() => act(s, 'unverify')}>
                            <BadgeX />
                            Unverify
                          </button>
                        ) : (
                          <button
                            className="primary sm"
                            onClick={() => act(s, 'verify')}
                          >
                            <BadgeCheck />
                            Verify
                          </button>
                        )}
                        <button
                          className="danger sm"
                          onClick={() => act(s, 'suspend')}
                        >
                          <Ban />
                          Suspend
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
    </>
  );
}
