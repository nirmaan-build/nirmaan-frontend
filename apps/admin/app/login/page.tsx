'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Boxes, LogIn } from 'lucide-react';
import { api, setToken, setRole } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ accessToken: string; role: string }>(
        '/admin/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      );
      setToken(res.accessToken);
      setRole(res.role);
      toast.success('Signed in');
      router.push('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="logo">
            <Boxes size={21} />
          </span>
          Nirmaan Admin
        </div>
        <div className="card">
          <h1 style={{ fontSize: 20 }}>Sign in</h1>
          <p className="subtitle" style={{ marginBottom: 4 }}>
            Restricted to allowlisted admin emails.
          </p>
          <form onSubmit={onSubmit}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              className="primary mt"
              type="submit"
              disabled={busy}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <LogIn />
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
