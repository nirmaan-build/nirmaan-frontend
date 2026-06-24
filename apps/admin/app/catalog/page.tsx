'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PackageSearch, Eye, EyeOff, X } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';

interface CatalogImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
}
interface Item {
  id: string;
  title: string;
  unit: string;
  priceEstimate: string | number | null;
  isActive: boolean;
  supplier: { id: string; businessName: string } | null;
  category: { id: string; name: string } | null;
  images: CatalogImage[];
}

export default function CatalogModerationPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);

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
      setItems(await api<Item[]>('/admin/catalog'));
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

  const toggle = async (item: Item) => {
    const action = item.isActive ? 'deactivate' : 'activate';
    try {
      await api(`/admin/catalog/${item.id}/${action}`, { method: 'PATCH' });
      toast.success(
        `“${item.title}” ${item.isActive ? 'hidden' : 'restored'}`,
      );
      await load();
    } catch (err) {
      handleError(err);
    }
  };

  // Image moderation (PRD-04 §5.8): remove a single bad image; the backend
  // auto-hides the listing if it was the last image.
  const removeImage = async (item: Item, imageId: string) => {
    if (!window.confirm(`Remove this image from “${item.title}”?`)) return;
    try {
      const res = await api<{ deactivated: boolean }>(
        `/admin/catalog/${item.id}/images/${imageId}`,
        { method: 'DELETE' },
      );
      toast.success(
        res.deactivated
          ? 'Image removed — listing hidden (no images left)'
          : 'Image removed',
      );
      await load();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Catalog Moderation</h1>
        <p className="subtitle">
          Hide a listing with a bad photo, wrong price, or spam — without needing
          the supplier to do it.
        </p>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <div className="empty">
            <PackageSearch />
            <span>No catalog items yet.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Supplier</th>
                  <th>Category</th>
                  <th>Images</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td style={{ fontWeight: 550 }}>{it.title}</td>
                    <td>{it.supplier?.businessName ?? <span className="muted">—</span>}</td>
                    <td>{it.category?.name ?? <span className="muted">—</span>}</td>
                    <td>
                      {it.images.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {it.images.map((img) => (
                            <span
                              key={img.id}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt=""
                                width={40}
                                height={40}
                                style={{
                                  objectFit: 'cover',
                                  borderRadius: 6,
                                  border: img.isPrimary
                                    ? '2px solid #2563eb'
                                    : '1px solid #ddd',
                                }}
                              />
                              <button
                                className="danger sm"
                                title="Remove image"
                                onClick={() => removeImage(it, img.id)}
                                style={{ padding: '2px 6px' }}
                              >
                                <X size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${it.isActive ? 'active' : 'inactive'}`}
                      >
                        {it.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          className={it.isActive ? 'danger sm' : 'primary sm'}
                          onClick={() => toggle(it)}
                        >
                          {it.isActive ? <EyeOff /> : <Eye />}
                          {it.isActive ? 'Hide' : 'Restore'}
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
