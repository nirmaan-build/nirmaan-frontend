'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PackageSearch, Eye, EyeOff, X, ChevronDown, ChevronRight, Store, Search } from 'lucide-react';
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

interface SupplierGroup {
  supplierId: string;
  businessName: string;
  items: Item[];
  expanded: boolean;
}

function groupBySupplier(items: Item[]): SupplierGroup[] {
  const map = new Map<string, SupplierGroup>();
  for (const item of items) {
    const key = item.supplier?.id ?? '__none__';
    const name = item.supplier?.businessName ?? 'Unknown Supplier';
    if (!map.has(key)) {
      // Collapsed by default — admin expands manually
      map.set(key, { supplierId: key, businessName: name, items: [], expanded: false });
    }
    map.get(key)!.items.push(item);
  }
  return [...map.values()].sort((a, b) => a.businessName.localeCompare(b.businessName));
}

export default function CatalogModerationPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<SupplierGroup[]>([]);

  // Dual search state
  const [supplierSearch, setSupplierSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');

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
      const items = await api<Item[]>('/admin/catalog');
      setGroups(groupBySupplier(items));
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

  const toggleGroup = (supplierId: string) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.supplierId === supplierId ? { ...g, expanded: !g.expanded } : g,
      ),
    );
  };

  const expandAll = () => setGroups((prev) => prev.map((g) => ({ ...g, expanded: true })));
  const collapseAll = () => setGroups((prev) => prev.map((g) => ({ ...g, expanded: false })));

  const toggle = async (item: Item) => {
    const action = item.isActive ? 'deactivate' : 'activate';
    try {
      await api(`/admin/catalog/${item.id}/${action}`, { method: 'PATCH' });
      toast.success(`"${item.title}" ${item.isActive ? 'hidden' : 'restored'}`);
      await load();
    } catch (err) {
      handleError(err);
    }
  };

  const removeImage = async (item: Item, imageId: string) => {
    if (!window.confirm(`Remove this image from "${item.title}"?`)) return;
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

  // Filter groups by supplier search, then filter items by item search
  const filteredGroups = useMemo(() => {
    const sq = supplierSearch.trim().toLowerCase();
    const iq = itemSearch.trim().toLowerCase();

    return groups
      .filter((g) => !sq || g.businessName.toLowerCase().includes(sq))
      .map((g) => ({
        ...g,
        // When there's an item search, auto-expand matching groups
        expanded: iq ? true : g.expanded,
        items: iq
          ? g.items.filter((i) => i.title.toLowerCase().includes(iq))
          : g.items,
      }))
      .filter((g) => !iq || g.items.length > 0); // hide empty groups when item search active
  }, [groups, supplierSearch, itemSearch]);

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const activeItems = groups.reduce((s, g) => s + g.items.filter((i) => i.isActive).length, 0);
  const expandedCount = filteredGroups.filter((g) => g.expanded).length;

  return (
    <>
      <div className="page-head">
        <h1>Catalog Moderation</h1>
        <p className="subtitle">
          All suppliers listed below. Expand a supplier to manage their listings.
        </p>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Suppliers', value: groups.length },
          { label: 'Total listings', value: totalItems },
          { label: 'Active', value: activeItems, color: 'var(--ok)' },
          { label: 'Hidden', value: totalItems - activeItems, color: 'var(--danger)' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '12px 20px', minWidth: 90 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Dual search bar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        {/* Supplier search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Store size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
            placeholder="Find a supplier…"
            style={{ paddingLeft: 32, width: '100%' }}
          />
          {supplierSearch && (
            <button onClick={() => setSupplierSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', padding: 2, cursor: 'pointer' }}>
              <X size={13} />
            </button>
          )}
        </div>
        {/* Item search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            placeholder="Search catalog items…"
            style={{ paddingLeft: 32, width: '100%' }}
          />
          {itemSearch && (
            <button onClick={() => setItemSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', padding: 2, cursor: 'pointer' }}>
              <X size={13} />
            </button>
          )}
        </div>
        {/* Expand/Collapse all */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={expandAll} style={{ fontSize: 12, padding: '0 12px', whiteSpace: 'nowrap' }}>
            <ChevronDown size={13} /> Expand all
          </button>
          <button onClick={collapseAll} style={{ fontSize: 12, padding: '0 12px', whiteSpace: 'nowrap' }}>
            <ChevronRight size={13} /> Collapse all
          </button>
        </div>
      </div>

      {/* Result summary when filtering */}
      {(supplierSearch || itemSearch) && (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>
          Showing {filteredGroups.length} supplier{filteredGroups.length !== 1 ? 's' : ''}
          {itemSearch && ` · ${filteredGroups.reduce((s, g) => s + g.items.length, 0)} matching listings`}
          {itemSearch && ' (auto-expanded)'}
        </p>
      )}

      {groups.length === 0 ? (
        <div className="card">
          <div className="empty">
            <PackageSearch />
            <span>No catalog items yet.</span>
          </div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="card">
          <div className="empty">
            <PackageSearch />
            <span>No results for your search.</span>
          </div>
        </div>
      ) : (
        filteredGroups.map((group) => {
          const activeCount = group.items.filter((i) => i.isActive).length;
          return (
            <div key={group.supplierId} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.supplierId)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 18px',
                  background: 'var(--surface-2)',
                  border: 'none',
                  borderBottom: group.expanded ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 0,
                }}
              >
                {group.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: 'var(--primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {group.businessName[0]}
                </div>
                <span style={{ fontWeight: 700, flex: 1, fontSize: 15 }}>{group.businessName}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {activeCount > 0 && (
                    <span className="badge active" style={{ fontSize: 11 }}>{activeCount} active</span>
                  )}
                  {group.items.length - activeCount > 0 && (
                    <span className="badge inactive" style={{ fontSize: 11 }}>{group.items.length - activeCount} hidden</span>
                  )}
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{group.items.length} total</span>
                </div>
              </button>

              {/* Items table */}
              {group.expanded && (
                group.items.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                    No listings for this supplier.
                  </div>
                ) : (
                  <div className="table-wrap" style={{ margin: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Images</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((it) => (
                          <tr key={it.id}>
                            <td style={{ fontWeight: 550 }}>{it.title}</td>
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
                                          border: img.isPrimary ? '2px solid var(--primary)' : '1px solid var(--border)',
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
                              <span className={`badge ${it.isActive ? 'active' : 'inactive'}`}>
                                {it.isActive ? 'Active' : 'Hidden'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button
                                  className={it.isActive ? 'danger sm' : 'primary sm'}
                                  onClick={() => toggle(it)}
                                >
                                  {it.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                                  {it.isActive ? 'Hide' : 'Restore'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>
          );
        })
      )}

      {/* Footer count when expanded */}
      {expandedCount > 0 && !itemSearch && !supplierSearch && (
        <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 8 }}>
          {expandedCount} supplier{expandedCount !== 1 ? 's' : ''} expanded · {groups.length - expandedCount} collapsed
        </p>
      )}
    </>
  );
}
