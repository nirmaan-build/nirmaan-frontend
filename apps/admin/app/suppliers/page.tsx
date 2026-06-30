'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Store, BadgeCheck, BadgeX, Ban, ShieldOff, ShieldCheck,
  Search, X, ChevronRight, MapPin, Tag, Package,
  Phone, Mail, FileText, RefreshCw, AlertTriangle, Check, Inbox,
} from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';
import { Modal } from '../components/Modal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Supplier {
  id: string;
  businessName: string;
  businessAddress: string | null;
  businessPincode: string | null;
  gstNumber: string | null;
  status: 'PENDING' | 'VERIFIED' | 'SUSPENDED';
  isVerified: boolean;
  excludedFromAutoDistribution: boolean;
  exclusionReason: string | null;
  hasLinkedPayoutAccount: boolean;
  createdAt: string;
  user: { id: string; fullName: string | null; email: string | null; phone: string | null };
  serviceAreas: { pincode: string }[];
  categories: { categoryId: string; category?: { id: string; name: string } }[];
  catalogItems?: { id: string; title: string; isActive: boolean }[];
}

interface Category { id: string; name: string }
interface Area { pincode: string; city: string; isActive: boolean }

type FilterStatus = 'ALL' | 'PENDING' | 'VERIFIED' | 'SUSPENDED';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'warn',
  VERIFIED: 'active',
  SUSPENDED: 'danger',
};

// ── Reusable drawer pieces ──────────────────────────────────────────────────

function TabSearch({
  inputRef, value, onChange, placeholder,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: 36, paddingRight: value ? 36 : 12, width: '100%' }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', padding: 4, cursor: 'pointer', minHeight: 'unset', display: 'grid', placeItems: 'center', borderRadius: 6 }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

/** Custom checkbox box — avoids the global `input{width:100%}` rule and looks cleaner. */
function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 20, height: 20, borderRadius: 6, flexShrink: 0,
        border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
        background: checked ? 'var(--primary)' : 'var(--surface)',
        display: 'grid', placeItems: 'center',
        transition: 'background .12s ease, border-color .12s ease',
      }}
    >
      {checked && <Check size={13} color="#fff" strokeWidth={3.5} />}
    </span>
  );
}

function CountPill({ selected, total }: { selected: number; total: number }) {
  const all = selected > 0 && selected === total;
  return (
    <span style={{
      marginLeft: 'auto', fontSize: 12, fontWeight: 600,
      padding: '4px 10px', borderRadius: 999,
      color: all ? 'var(--primary)' : 'var(--muted)',
      background: all ? 'var(--primary-soft)' : 'var(--surface-2)',
      border: `1px solid ${all ? 'transparent' : 'var(--border)'}`,
    }}>
      {selected} / {total} selected
    </span>
  );
}

function EmptyTab({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '36px 20px', color: 'var(--muted)', textAlign: 'center' }}>
      <Inbox size={28} style={{ opacity: 0.5 }} />
      <span style={{ fontSize: 13 }}>{text}</span>
    </div>
  );
}

interface PickerItem { key: string; primary: string; secondary?: string }

/** Search + quick-select + scrollable checkbox list + sticky save footer. Shared by Areas & Categories. */
function PickerTab({
  inputRef, search, onSearch, placeholder,
  items, selected, onToggle, onSelectAll, onClear,
  emptyText, busy, onSave, saveNoun,
}: {
  inputRef: React.RefObject<HTMLInputElement>;
  search: string;
  onSearch: (v: string) => void;
  placeholder: string;
  items: PickerItem[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  emptyText: string;
  busy: boolean;
  onSave: () => void;
  saveNoun: string;
}) {
  const q = search.trim().toLowerCase();
  const visible = items.filter(
    (i) => !q || i.primary.toLowerCase().includes(q) || (i.secondary?.toLowerCase().includes(q) ?? false),
  );
  const count = selected.size;
  const dirty = count > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <TabSearch inputRef={inputRef} value={search} onChange={onSearch} placeholder={placeholder} />

      {/* Quick-select toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
        <button className="ghost sm" onClick={onSelectAll} style={{ fontSize: 12, padding: '5px 10px', minHeight: 'unset', borderRadius: 7 }}>
          Select all
        </button>
        <button className="ghost sm" onClick={onClear} style={{ fontSize: 12, padding: '5px 10px', minHeight: 'unset', borderRadius: 7 }}>
          Clear
        </button>
        <CountPill selected={count} total={items.length} />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, minHeight: 120, margin: '0 -4px', padding: '2px 4px' }}>
        {items.length === 0 ? (
          <EmptyTab text={emptyText} />
        ) : visible.length === 0 ? (
          <EmptyTab text={`No matches for “${search}”`} />
        ) : (
          visible.map((item) => {
            const checked = selected.has(item.key);
            return (
              <label
                key={item.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10,
                  border: `1px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                  background: checked ? 'var(--primary-soft)' : 'var(--surface-2)',
                  cursor: 'pointer', flexShrink: 0,
                  transition: 'background .12s ease, border-color .12s ease',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(item.key)}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0, margin: 0 }}
                />
                <CheckBox checked={checked} />
                <span style={{ fontWeight: 600, fontSize: 14 }}>{item.primary}</span>
                {item.secondary && (
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{item.secondary}</span>
                )}
              </label>
            );
          })
        )}
      </div>

      {/* Sticky save footer */}
      <div style={{ position: 'sticky', bottom: 0, background: 'var(--surface)', paddingTop: 14, marginTop: 4 }}>
        <button className="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onSave} disabled={busy}>
          {busy ? 'Saving…' : dirty ? `Save ${count} ${saveNoun}` : `Save (none selected)`}
        </button>
      </div>
    </div>
  );
}

// ── Supplier Detail Drawer ────────────────────────────────────────────────────

function SupplierDrawer({
  supplier,
  allCategories,
  allAreas,
  onClose,
  onReload,
  onAction,
}: {
  supplier: Supplier;
  allCategories: Category[];
  allAreas: Area[];
  onClose: () => void;
  onReload: () => void;
  onAction: (s: Supplier, action: string) => Promise<void>;
}) {
  const [tab, setTab] = useState<'overview' | 'areas' | 'categories' | 'catalog'>('overview');

  // Areas editor state
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(
    () => new Set(supplier.serviceAreas.map((a) => a.pincode)),
  );
  const [areasBusy, setAreasBusy] = useState(false);

  // Categories editor state
  const [selectedCats, setSelectedCats] = useState<Set<string>>(
    () => new Set(supplier.categories.map((c) => c.categoryId)),
  );
  const [catsBusy, setCatsBusy] = useState(false);

  // Exclusion modal
  const [showExclude, setShowExclude] = useState(false);
  const [exclusionReason, setExclusionReason] = useState(supplier.exclusionReason ?? '');
  const [exclusionBusy, setExclusionBusy] = useState(false);

  // Per-tab search
  const [areaSearch, setAreaSearch] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const tabSearchRef = useRef<HTMLInputElement>(null);

  const saveAreas = async () => {
    setAreasBusy(true);
    try {
      await api(`/admin/suppliers/${supplier.id}/areas`, {
        method: 'PUT',
        body: JSON.stringify({ pincodes: [...selectedAreas] }),
      });
      toast.success('Service areas updated');
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setAreasBusy(false);
    }
  };

  const saveCats = async () => {
    setCatsBusy(true);
    try {
      await api(`/admin/suppliers/${supplier.id}/categories`, {
        method: 'PUT',
        body: JSON.stringify({ categoryIds: [...selectedCats] }),
      });
      toast.success('Categories updated');
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setCatsBusy(false);
    }
  };

  const submitExclusion = async (e: FormEvent, exclude: boolean) => {
    e.preventDefault();
    setExclusionBusy(true);
    try {
      await api(`/admin/distribution/suppliers/${supplier.id}/exclusion`, {
        method: 'PATCH',
        body: JSON.stringify({ excluded: exclude, reason: exclude ? exclusionReason || undefined : undefined }),
      });
      toast.success(exclude ? 'Excluded from auto-distribution' : 'Restored to auto-distribution');
      setShowExclude(false);
      onReload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    } finally {
      setExclusionBusy(false);
    }
  };

  const switchTab = (t: typeof tab) => {
    setTab(t);
    // Clear search when switching tabs and focus the new search box
    setAreaSearch(''); setCatSearch(''); setCatalogSearch('');
    setTimeout(() => tabSearchRef.current?.focus(), 50);
  };

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    border: 'none',
    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
    background: 'transparent',
    fontWeight: active ? 700 : 400,
    color: active ? 'var(--primary)' : 'var(--muted)',
    cursor: 'pointer',
    fontSize: 13,
    borderRadius: 0,
    whiteSpace: 'nowrap',
  });

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        display: 'flex', alignItems: 'stretch',
      }}
    >
      {/* Backdrop */}
      <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />

      {/* Drawer panel */}
      <div style={{
        width: '100%', maxWidth: 520,
        background: 'var(--surface)',
        color: 'var(--text)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 0',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'var(--primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, fontSize: 18, fontWeight: 700,
            }}>
              {supplier.businessName[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{supplier.businessName}</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <span className={`badge ${STATUS_BADGE[supplier.status]}`}>{supplier.status}</span>
                {supplier.isVerified && <span className="badge active">Verified</span>}
                {supplier.excludedFromAutoDistribution && (
                  <span className="badge danger" title={supplier.exclusionReason ?? ''}>
                    <ShieldOff size={10} style={{ marginRight: 3 }} />Excluded
                  </span>
                )}
              </div>
            </div>
            <button className="ghost sm" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingBottom: 12 }}>
            {supplier.isVerified ? (
              <button className="sm" onClick={() => onAction(supplier, 'unverify')}>
                <BadgeX size={14} /> Unverify
              </button>
            ) : (
              <button className="primary sm" onClick={() => onAction(supplier, 'verify')}
                disabled={supplier.status === 'SUSPENDED'}>
                <BadgeCheck size={14} /> Verify
              </button>
            )}
            {supplier.status === 'SUSPENDED' ? (
              <button className="primary sm" onClick={() => onAction(supplier, 'unsuspend')}>
                <RefreshCw size={14} /> Unsuspend
              </button>
            ) : (
              <button className="danger sm" onClick={() => onAction(supplier, 'suspend')}>
                <Ban size={14} /> Suspend
              </button>
            )}
            <button
              className={supplier.excludedFromAutoDistribution ? 'primary sm' : 'sm'}
              onClick={() => setShowExclude(true)}
            >
              {supplier.excludedFromAutoDistribution
                ? <><ShieldCheck size={14} /> Restore dist.</>
                : <><ShieldOff size={14} /> Exclude dist.</>}
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: -1 }}>
            {(['overview', 'areas', 'categories', 'catalog'] as const).map((t) => (
              <button key={t} onClick={() => switchTab(t)} style={TAB_STYLE(tab === t)}>
                {t === 'overview' ? 'Overview' : t === 'areas' ? `Areas (${supplier.serviceAreas.length})` : t === 'categories' ? `Categories (${supplier.categories.length})` : `Catalog (${supplier.catalogItems?.length ?? '…'})`}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div style={{ padding: 24, flex: 1,  }}>

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <InfoRow icon={<Mail size={15} />} label="Email" value={supplier.user.email} />
              <InfoRow icon={<Phone size={15} />} label="Phone" value={supplier.user.phone} />
              <InfoRow icon={<FileText size={15} />} label="GST" value={supplier.gstNumber} />
              <InfoRow icon={<MapPin size={15} />} label="Business pincode" value={supplier.businessPincode} />
              <InfoRow icon={<Store size={15} />} label="Address" value={supplier.businessAddress} />
              <InfoRow
                icon={<Tag size={15} />}
                label="Member since"
                value={new Date(supplier.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              />
              <InfoRow
                icon={<Package size={15} />}
                label="Payout account"
                value={supplier.hasLinkedPayoutAccount ? '✓ Linked' : '✗ Not linked'}
              />
              {supplier.exclusionReason && (
                <div style={{
                  background: 'var(--danger-bg, #fef2f2)',
                  border: '1px solid var(--danger-border, #fecaca)',
                  borderRadius: 8, padding: '10px 14px',
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <AlertTriangle size={15} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--danger)' }}>
                      Distribution exclusion reason
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 13 }}>{supplier.exclusionReason}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Service Areas ── */}
          {tab === 'areas' && (
            <PickerTab
              inputRef={tabSearchRef}
              search={areaSearch}
              onSearch={setAreaSearch}
              placeholder="Search pincode or city…"
              items={allAreas.map((a) => ({ key: a.pincode, primary: a.pincode, secondary: a.city }))}
              selected={selectedAreas}
              onToggle={(key) => setSelectedAreas((prev) => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key); else next.add(key);
                return next;
              })}
              onSelectAll={() => setSelectedAreas(new Set(allAreas.map((a) => a.pincode)))}
              onClear={() => setSelectedAreas(new Set())}
              emptyText="No active areas configured yet."
              busy={areasBusy}
              onSave={saveAreas}
              saveNoun="areas"
            />
          )}

          {/* ── Categories ── */}
          {tab === 'categories' && (
            <PickerTab
              inputRef={tabSearchRef}
              search={catSearch}
              onSearch={setCatSearch}
              placeholder="Search categories…"
              items={allCategories.map((c) => ({ key: c.id, primary: c.name }))}
              selected={selectedCats}
              onToggle={(key) => setSelectedCats((prev) => {
                const next = new Set(prev);
                if (next.has(key)) next.delete(key); else next.add(key);
                return next;
              })}
              onSelectAll={() => setSelectedCats(new Set(allCategories.map((c) => c.id)))}
              onClear={() => setSelectedCats(new Set())}
              emptyText="No categories configured yet."
              busy={catsBusy}
              onSave={saveCats}
              saveNoun="categories"
            />
          )}

          {/* ── Catalog ── */}
          {tab === 'catalog' && (() => {
            const items = supplier.catalogItems ?? [];
            const q = catalogSearch.toLowerCase();
            const visible = items.filter((i) => !q || i.title.toLowerCase().includes(q));
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <TabSearch inputRef={tabSearchRef} value={catalogSearch} onChange={setCatalogSearch} placeholder="Search listings…" />
                {items.length === 0 ? (
                  <EmptyTab text="No listings yet." />
                ) : visible.length === 0 ? (
                  <EmptyTab text={`No listings match “${catalogSearch}”`} />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {visible.map((item) => (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: 'var(--surface-2)', border: '1px solid var(--border)',
                      }}>
                        <Package size={15} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 14, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                        <span className={`badge ${item.isActive ? 'active' : 'inactive'}`} style={{ fontSize: 11, flexShrink: 0 }}>
                          {item.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {items.length > 0 && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>
                    {visible.length} of {items.length} listings shown · Manage visibility in Catalog Moderation
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Exclusion modal */}
      <Modal
        open={showExclude}
        title={supplier.excludedFromAutoDistribution
          ? `Restore ${supplier.businessName}?`
          : `Exclude ${supplier.businessName}?`}
        onClose={() => setShowExclude(false)}
      >
        {supplier.excludedFromAutoDistribution ? (
          <>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--muted)' }}>
              Restores the supplier to automatic RFQ matching.
            </p>
            <div className="modal-foot">
              <button onClick={() => setShowExclude(false)}>Cancel</button>
              <button className="primary" disabled={exclusionBusy}
                onClick={(e) => void submitExclusion(e as unknown as FormEvent, false)}>
                {exclusionBusy ? 'Restoring…' : 'Restore'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted)' }}>
              Skips this supplier in all future auto-distributions. Their catalog and existing
              orders are unaffected; manual assignment still works.
            </p>
            <label>Reason (optional)</label>
            <input
              value={exclusionReason}
              onChange={(e) => setExclusionReason(e.target.value)}
              placeholder="e.g. Delivery complaints"
              autoFocus
            />
            <div className="modal-foot">
              <button onClick={() => setShowExclude(false)}>Cancel</button>
              <button className="danger" disabled={exclusionBusy}
                onClick={(e) => void submitExclusion(e as unknown as FormEvent, true)}>
                {exclusionBusy ? 'Excluding…' : 'Exclude from auto-distribution'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ color: 'var(--muted)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ margin: 0, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: value ? 500 : 400, color: value ? 'inherit' : 'var(--muted)' }}>
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selected, setSelected] = useState<Supplier | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof ApiError && err.status === 401) { router.push('/login'); return; }
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    },
    [router],
  );

  const load = useCallback(async () => {
    try {
      const [sups, cats, areasData] = await Promise.all([
        api<Supplier[]>('/admin/suppliers'),
        api<Category[]>('/admin/categories'),
        api<Area[]>('/admin/areas'),
      ]);
      setSuppliers(sups);
      setCategories(cats);
      setAreas(areasData.filter((a) => a.isActive));
      // Refresh selected drawer if open
      setSelected((prev) => prev ? sups.find((s) => s.id === prev.id) ?? null : null);
    } catch (err) {
      handleError(err);
    }
  }, [handleError]);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    void load();
  }, [router, load]);

  // Filter & search
  const filtered = useMemo(() => {
    let list = suppliers;
    if (filterStatus !== 'ALL') list = list.filter((s) => s.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.businessName.toLowerCase().includes(q) ||
          s.user.email?.toLowerCase().includes(q) ||
          s.user.fullName?.toLowerCase().includes(q) ||
          s.gstNumber?.toLowerCase().includes(q) ||
          s.businessPincode?.includes(q),
      );
    }
    return list;
  }, [suppliers, filterStatus, search]);

  // Stats
  const stats = useMemo(() => ({
    total: suppliers.length,
    verified: suppliers.filter((s) => s.isVerified).length,
    pending: suppliers.filter((s) => s.status === 'PENDING').length,
    suspended: suppliers.filter((s) => s.status === 'SUSPENDED').length,
    excluded: suppliers.filter((s) => s.excludedFromAutoDistribution).length,
  }), [suppliers]);

  const act = async (s: Supplier, action: string) => {
    if (action === 'suspend' && !window.confirm(`Suspend "${s.businessName}"?`)) return;
    try {
      await api(`/admin/suppliers/${s.id}/${action}`, { method: 'PATCH' });
      const msg: Record<string, string> = {
        verify: 'Supplier verified',
        unverify: 'Verification removed',
        suspend: 'Supplier suspended',
        unsuspend: 'Supplier unsuspended — status reset to Pending',
      };
      toast.success(msg[action] ?? 'Done');
      await load();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Suppliers &amp; Verification</h1>
        <p className="subtitle">
          Verify, suspend, set service areas and categories. Click a row to open the full management drawer.
        </p>
      </div>

      {/* ── Stats strip ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total },
          { label: 'Verified', value: stats.verified, color: 'var(--success, #16a34a)' },
          { label: 'Pending', value: stats.pending, color: 'var(--warn, #d97706)' },
          { label: 'Suspended', value: stats.suspended, color: 'var(--danger)' },
          { label: 'Excl. dist.', value: stats.excluded },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '12px 18px', minWidth: 90 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Search + Filter bar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, GST, pincode…"
            style={{ paddingLeft: 32, width: '100%' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2 }}>
              <X size={14} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ALL', 'PENDING', 'VERIFIED', 'SUSPENDED'] as FilterStatus[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              style={{
                padding: '6px 12px', fontSize: 13, borderRadius: 6,
                border: filterStatus === f ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                background: filterStatus === f ? 'var(--primary-subtle, #eff6ff)' : 'transparent',
                color: filterStatus === f ? 'var(--primary)' : 'inherit',
                fontWeight: filterStatus === f ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {f === 'ALL' ? `All (${suppliers.length})` : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty" style={{ padding: 40 }}>
            <Store />
            <span>{search || filterStatus !== 'ALL' ? 'No suppliers match your filters.' : 'No suppliers have registered yet.'}</span>
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
                  <th>Categories</th>
                  <th>Status</th>
                  <th>Dist.</th>
                  <th>Actions</th>
                  <th style={{ width: 32 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelected(s)}
                  >
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: 8,
                          background: 'var(--primary)', color: '#fff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0,
                        }}>
                          {s.businessName[0]}
                        </div>
                        {s.businessName}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{s.user.fullName ?? '—'}</div>
                      <div className="muted" style={{ fontSize: 12 }}>{s.user.email ?? s.user.phone ?? ''}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{s.gstNumber ?? <span className="muted">—</span>}</td>
                    <td>
                      <span style={{ fontSize: 13 }}>{s.serviceAreas.length} area{s.serviceAreas.length !== 1 ? 's' : ''}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13 }}>{s.categories.length} cat{s.categories.length !== 1 ? 's' : ''}</span>
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[s.status]}`}>
                        {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td>
                      {s.excludedFromAutoDistribution ? (
                        <span className="badge danger" title={s.exclusionReason ?? ''}>
                          <ShieldOff size={10} style={{ marginRight: 3 }} />Excluded
                        </span>
                      ) : (
                        <span className="badge active">
                          <ShieldCheck size={10} style={{ marginRight: 3 }} />Active
                        </span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="actions" style={{ justifyContent: 'flex-end', flexWrap: 'wrap', gap: 4 }}>
                        {s.isVerified ? (
                          <button className="sm" onClick={() => act(s, 'unverify')}>
                            <BadgeX size={13} /> Unverify
                          </button>
                        ) : (
                          <button className="primary sm" onClick={() => act(s, 'verify')}
                            disabled={s.status === 'SUSPENDED'}>
                            <BadgeCheck size={13} /> Verify
                          </button>
                        )}
                        {s.status === 'SUSPENDED' ? (
                          <button className="primary sm" onClick={() => act(s, 'unsuspend')}>
                            <RefreshCw size={13} /> Unsuspend
                          </button>
                        ) : (
                          <button className="danger sm" onClick={() => act(s, 'suspend')}>
                            <Ban size={13} /> Suspend
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Detail drawer ── */}
      {selected && (
        <SupplierDrawer
          supplier={selected}
          allCategories={categories}
          allAreas={areas}
          onClose={() => setSelected(null)}
          onReload={load}
          onAction={async (s, action) => { await act(s, action); }}
        />
      )}
    </>
  );
}
