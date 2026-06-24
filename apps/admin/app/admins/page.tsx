'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, ShieldCheck, Power, PowerOff } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

const ROLES = ['SUPER_ADMIN', 'OPS', 'SUPPORT', 'VIEWER'] as const;
type Role = (typeof ROLES)[number];

interface Admin {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminsPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<Role>('OPS');
  const [password, setPassword] = useState('');
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
      setAdmins(await api<Admin[]>('/admin/admins'));
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
      await api('/admin/admins', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          fullName: fullName.trim(),
          role,
          password,
        }),
      });
      setEmail('');
      setFullName('');
      setRole('OPS');
      setPassword('');
      toast.success('Admin created');
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(a: Admin, next: Role) {
    if (next === a.role) return;
    try {
      await api(`/admin/admins/${a.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: next }),
      });
      toast.success(`${a.email} → ${next}`);
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  async function toggleActive(a: Admin) {
    try {
      await api(`/admin/admins/${a.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !a.isActive }),
      });
      toast.success(`${a.email} ${a.isActive ? 'deactivated' : 'activated'}`);
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Admins</h1>
        <p className="subtitle">
          Manage admin accounts and roles. SUPER_ADMIN only.
        </p>
      </div>

      <div className="card">
        <h2>Add an admin</h2>
        <form onSubmit={onCreate}>
          <div className="row">
            <div>
              <label>Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Asha Ops"
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="asha@nirmaan.in"
                required
              />
            </div>
            <div style={{ maxWidth: 170 }}>
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Initial password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min 8 chars"
                required
                minLength={8}
              />
            </div>
          </div>
          <button className="primary mt" type="submit" disabled={busy}>
            <Plus />
            {busy ? 'Creating…' : 'Create admin'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Dev: the password is set directly. Production should email a reset link
          (PRD-04 §4.4).
        </p>
      </div>

      <div className="card">
        <h2>All admins</h2>
        {admins.length === 0 ? (
          <div className="empty">
            <ShieldCheck />
            <span>No admins yet.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 550 }}>{a.fullName}</td>
                    <td>{a.email}</td>
                    <td>
                      <select
                        value={a.role}
                        onChange={(e) => changeRole(a, e.target.value as Role)}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span
                        className={`badge ${a.isActive ? 'active' : 'inactive'}`}
                      >
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {a.lastLoginAt ? (
                        new Date(a.lastLoginAt).toLocaleString()
                      ) : (
                        <span className="muted">never</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="sm" onClick={() => toggleActive(a)}>
                          {a.isActive ? <PowerOff /> : <Power />}
                          {a.isActive ? 'Deactivate' : 'Activate'}
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
