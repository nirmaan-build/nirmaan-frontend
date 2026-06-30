'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  ImageOff,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/lib/useAuthGuard';
import {
  useSupplierCatalog,
  useCreateCatalogItem,
  useUpdateCatalogItem,
  useDeleteCatalogItem,
  useCategories,
  useUnits,
  type SupplierCatalogItem,
} from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { money } from '@/lib/format';
import { getUser } from '@/lib/cookies';
import { SkeletonList } from '../../components/Skeleton';
import { EmptyState } from '../../components/EmptyState';

// ── Item form (add / edit) ────────────────────────────────────────────────────

interface ItemFormState {
  title: string;
  categoryId: string;
  unitId: string;
  priceEstimate: string;
  imageUrl: string; // single URL for now; stored in imageUrls[0]
}

const EMPTY_FORM: ItemFormState = {
  title: '',
  categoryId: '',
  unitId: '',
  priceEstimate: '',
  imageUrl: '',
};

function ItemForm({
  initial,
  categories,
  units,
  onSave,
  onCancel,
  busy,
}: {
  initial: ItemFormState;
  categories: { id: string; name: string }[];
  units: { id: string; name: string; shortCode: string }[];
  onSave: (form: ItemFormState) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const t = useT();
  const [form, setForm] = useState<ItemFormState>(initial);
  const set = (k: keyof ItemFormState, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.categoryId || !form.unitId) {
      toast.error(t('common.fillAllFields'));
      return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          {t('supplier.itemTitle')} *
        </label>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder={t('supplier.itemTitlePlaceholder')}
          required
          autoFocus
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {t('supplier.itemCategory')} *
          </label>
          <select
            value={form.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            required
            style={{ width: '100%' }}
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
            {t('supplier.itemUnit')} *
          </label>
          <select
            value={form.unitId}
            onChange={(e) => set('unitId', e.target.value)}
            required
            style={{ width: '100%' }}
          >
            <option value="">Select…</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.shortCode})</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          {t('supplier.itemPrice')}
        </label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={form.priceEstimate}
          onChange={(e) => set('priceEstimate', e.target.value)}
          placeholder={t('supplier.itemPricePlaceholder')}
          style={{ width: '100%' }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          {t('supplier.itemImageUrl')}
        </label>
        <input
          type="url"
          value={form.imageUrl}
          onChange={(e) => set('imageUrl', e.target.value)}
          placeholder={t('supplier.itemImageUrlPlaceholder')}
          style={{ width: '100%' }}
        />
        {form.imageUrl && (
          <div style={{ marginTop: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={form.imageUrl}
              alt="preview"
              style={{ height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1 }}>
          {t('common.cancel')}
        </button>
        <button type="submit" className="primary" disabled={busy} style={{ flex: 1 }}>
          <Check size={15} />
          {busy ? t('supplier.itemSaving') : t('supplier.itemSave')}
        </button>
      </div>
    </form>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const router = useRouter();
  const t = useT();
  const { ready } = useAuthGuard();
  const user = getUser();

  const { data: listings, isLoading } = useSupplierCatalog();
  const { data: categories = [] } = useCategories('en');
  const { data: units = [] } = useUnits('en');

  const createItem = useCreateCatalogItem();
  const updateItem = useUpdateCatalogItem();
  const deleteItem = useDeleteCatalogItem();

  // null = hidden, 'new' = adding, string = editing by id
  const [formMode, setFormMode] = useState<null | 'new' | string>(null);
  const [editInitial, setEditInitial] = useState<ItemFormState>(EMPTY_FORM);

  if (!ready) return <SkeletonList rows={4} />;

  if (user && !user.isSupplier) {
    return (
      <EmptyState
        Icon={Package}
        title="Supplier access required"
        subtitle="Enable supplier mode in your profile to manage inventory."
        action={
          <button className="primary" onClick={() => router.push('/profile')}>
            Go to Profile
          </button>
        }
      />
    );
  }

  const openEdit = (item: SupplierCatalogItem) => {
    setEditInitial({
      title: item.title,
      categoryId: item.category.id,
      unitId: '', // unit comes back as shortCode string — map below
      priceEstimate: item.priceEstimate != null ? String(item.priceEstimate) : '',
      imageUrl: item.imageUrls?.[0] ?? '',
    });
    setFormMode(item.id);
  };

  const handleSave = async (form: ItemFormState, existingId?: string) => {
    const imageUrls = form.imageUrl.trim() ? [form.imageUrl.trim()] : [];
    const price = form.priceEstimate ? Number(form.priceEstimate) : undefined;

    if (existingId) {
      await updateItem.mutateAsync({
        id: existingId,
        title: form.title.trim(),
        priceEstimate: price ?? null,
        imageUrls,
      });
      toast.success(t('supplier.itemUpdated'));
    } else {
      await createItem.mutateAsync({
        title: form.title.trim(),
        categoryId: form.categoryId,
        unitId: form.unitId,
        priceEstimate: price,
        imageUrls,
      });
      toast.success(t('supplier.itemAdded'));
    }
    setFormMode(null);
  };

  const handleToggle = async (item: SupplierCatalogItem) => {
    await updateItem.mutateAsync({ id: item.id, isActive: !item.isActive });
    toast.success(item.isActive ? t('supplier.inactive') : t('supplier.active'));
  };

  const handleDelete = async (item: SupplierCatalogItem) => {
    if (!window.confirm(t('supplier.itemDeleteConfirm'))) return;
    await deleteItem.mutateAsync(item.id);
    toast.success(t('supplier.itemDeleted'));
    if (formMode === item.id) setFormMode(null);
  };

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <button
          onClick={() => router.push('/supplier')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--primary)',
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={22} /> {t('supplier.inventory')}
        </h1>
      </div>

      {/* ── Add / Edit form ── */}
      {formMode !== null && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16 }}>
            {formMode === 'new' ? t('supplier.addItem') : t('supplier.editItem')}
          </h2>
          <ItemForm
            initial={formMode === 'new' ? EMPTY_FORM : editInitial}
            categories={categories}
            units={units}
            onSave={(form) => void handleSave(form, formMode === 'new' ? undefined : formMode)}
            onCancel={() => setFormMode(null)}
            busy={createItem.isPending || updateItem.isPending}
          />
        </div>
      )}

      {/* ── Add button (when form is hidden) ── */}
      {formMode === null && (
        <button
          className="primary"
          onClick={() => setFormMode('new')}
          style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Plus size={18} />
          {t('supplier.addItem')}
        </button>
      )}

      {/* ── Listings ── */}
      {isLoading ? (
        <SkeletonList rows={4} />
      ) : !listings?.length ? (
        <EmptyState
          Icon={Package}
          title={t('supplier.inventoryEmpty')}
          subtitle=""
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {listings.map((item) => {
            const img = item.imageUrls?.[0];
            const isEditing = formMode === item.id;
            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  opacity: item.isActive ? 1 : 0.65,
                  border: isEditing ? '2px solid var(--primary)' : undefined,
                }}
              >
                <div style={{ display: 'flex', gap: 0 }}>
                  {/* Thumbnail */}
                  <div style={{ width: 80, height: 80, flexShrink: 0, background: 'var(--skeleton)' }}>
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ImageOff size={24} style={{ color: 'var(--muted)', opacity: 0.4 }} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, padding: '10px 12px', minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, flex: 1 }}>{item.title}</p>
                      <span className={`badge ${item.isActive ? 'active' : 'inactive'}`} style={{ flexShrink: 0, fontSize: 11 }}>
                        {item.isActive ? t('supplier.active') : t('supplier.inactive')}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                      {item.category.name}
                    </p>
                    {item.priceEstimate && (
                      <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                        {money(item.priceEstimate)} / {item.unit}
                      </p>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <button
                        className="sm"
                        onClick={() => (isEditing ? setFormMode(null) : openEdit(item))}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <Pencil size={13} />
                        {isEditing ? t('common.cancel') : 'Edit'}
                      </button>
                      <button
                        className="sm"
                        onClick={() => void handleToggle(item)}
                        disabled={updateItem.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        {item.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                        {item.isActive ? t('supplier.toggleInactive') : t('supplier.toggleActive')}
                      </button>
                      <button
                        className="danger sm"
                        onClick={() => void handleDelete(item)}
                        disabled={deleteItem.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}
                      >
                        <Trash2 size={13} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
