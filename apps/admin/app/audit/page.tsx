'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ScrollText } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  admin: { id: string; fullName: string; email: string; role: string } | null;
}

export default function AuditPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<AuditEntry[]>([]);

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
      setEntries(await api<AuditEntry[]>('/admin/audit-log'));
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

  return (
    <>
      <div className="page-head">
        <h1>Audit Log</h1>
        <p className="subtitle">
          Every sensitive admin action, newest first. Readable by SUPER_ADMIN
          and OPS.
        </p>
      </div>

      <div className="card">
        {entries.length === 0 ? (
          <div className="empty">
            <ScrollText />
            <span>No audit entries yet.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Entity</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((en) => (
                  <tr key={en.id}>
                    <td>{new Date(en.createdAt).toLocaleString()}</td>
                    <td>
                      {en.admin ? (
                        `${en.admin.fullName} (${en.admin.role})`
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <code>{en.action}</code>
                    </td>
                    <td>
                      {en.entityType}{' '}
                      <span className="muted">{en.entityId}</span>
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
