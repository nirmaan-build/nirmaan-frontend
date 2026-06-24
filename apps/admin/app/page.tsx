'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FolderTree,
  MapPin,
  Store,
  PackageSearch,
  BadgeCheck,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';
import { HeadlineStrip } from './components/HeadlineStrip';

interface Category {
  id: string;
}
interface Area {
  pincode: string;
  isActive: boolean;
}
interface Supplier {
  id: string;
  businessName: string;
  status: string;
  isVerified: boolean;
  user: { fullName: string | null; email: string | null; phone: string | null };
}
interface Item {
  id: string;
  isActive: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const load = useCallback(async () => {
    try {
      const [c, a, s, i] = await Promise.all([
        api<Category[]>('/admin/categories'),
        api<Area[]>('/admin/areas'),
        api<Supplier[]>('/admin/suppliers'),
        api<Item[]>('/admin/catalog'),
      ]);
      setCategories(c);
      setAreas(a);
      setSuppliers(s);
      setItems(i);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    void load();
  }, [router, load]);

  const activeAreas = areas.filter((a) => a.isActive).length;
  const verified = suppliers.filter((s) => s.isVerified).length;
  const pending = suppliers.filter(
    (s) => !s.isVerified && s.status !== 'SUSPENDED',
  );
  const activeItems = items.filter((i) => i.isActive).length;

  const cards = [
    {
      label: 'Categories',
      value: categories.length,
      sub: 'Live in the catalog tree',
      icon: FolderTree,
      tone: 'green',
    },
    {
      label: 'Serviceable areas',
      value: activeAreas,
      sub: `${areas.length} pincode${areas.length === 1 ? '' : 's'} total`,
      icon: MapPin,
      tone: 'blue',
    },
    {
      label: 'Verified suppliers',
      value: verified,
      sub: `${suppliers.length} registered`,
      icon: Store,
      tone: 'amber',
    },
    {
      label: 'Active listings',
      value: activeItems,
      sub: `${items.length - activeItems} hidden`,
      icon: PackageSearch,
      tone: 'red',
    },
  ] as const;

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p className="subtitle">
          A live snapshot of the Nirmaan marketplace — categories, coverage,
          suppliers, and listings.
        </p>
      </div>

      <HeadlineStrip />

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="stat-grid">
            {cards.map((c) => {
              const Icon = c.icon;
              return (
                <div className="stat-card" key={c.label}>
                  <div className="stat-top">
                    <span className="stat-label">{c.label}</span>
                    <span className={`stat-ico ${c.tone}`}>
                      <Icon />
                    </span>
                  </div>
                  <div className="stat-value">{c.value}</div>
                  <div className="stat-sub">{c.sub}</div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-head">
              <h2>
                <Clock
                  size={16}
                  style={{ verticalAlign: '-3px', marginRight: 7 }}
                />
                Suppliers awaiting verification
              </h2>
              <Link
                href="/suppliers"
                className="badge warn"
                style={{ textTransform: 'none' }}
              >
                {pending.length} pending
              </Link>
            </div>

            {pending.length === 0 ? (
              <div className="empty">
                <BadgeCheck />
                <span>Everyone is verified. Nothing waiting on you.</span>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Contact</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.slice(0, 6).map((s) => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 550 }}>{s.businessName}</td>
                        <td className="muted">
                          {s.user.fullName ??
                            s.user.email ??
                            s.user.phone ??
                            '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href="/suppliers" className="badge warn">
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pending.length > 6 && (
              <Link
                href="/suppliers"
                className="mt"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 550,
                }}
              >
                View all suppliers <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </>
      )}
    </>
  );
}
