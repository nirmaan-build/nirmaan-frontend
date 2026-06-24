'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Megaphone, Send } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

export default function BroadcastPage() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [segment, setSegment] = useState('all_users');
  const [pincode, setPincode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getToken()) router.push('/login');
  }, [router]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ sent: number }>('/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          message: message.trim(),
          segment,
          ...(segment === 'suppliers' && pincode.trim()
            ? { pincode: pincode.trim() }
            : {}),
        }),
      });
      toast.success(`Broadcast sent to ${res.sent} user(s)`);
      setMessage('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push('/login');
        return;
      }
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Notification Broadcast</h1>
        <p className="subtitle">
          Announce a new area opening or a policy update to a segment.
        </p>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={onSend}>
          <label>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="We've opened in Almora!"
            rows={3}
            required
          />

          <label>Segment</label>
          <select value={segment} onChange={(e) => setSegment(e.target.value)}>
            <option value="all_users">All users</option>
            <option value="buyers">All buyers</option>
            <option value="suppliers">All suppliers</option>
          </select>

          {segment === 'suppliers' && (
            <>
              <label>Restrict to pincode (optional)</label>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="248001"
              />
            </>
          )}

          <button className="primary mt" type="submit" disabled={busy}>
            {busy ? (
              <>
                <Megaphone />
                Sending…
              </>
            ) : (
              <>
                <Send />
                Send broadcast
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
}
