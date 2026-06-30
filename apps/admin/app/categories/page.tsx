'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Pencil, Eye, EyeOff, FolderTree } from 'lucide-react';
import { api, ApiError, getToken } from '@/lib/api';
import { Modal } from '../components/Modal';

interface Translation {
  locale: string;
  name: string;
}
interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isHidden: boolean;
  iconUrl: string | null;
  coverImageUrl: string | null;
  translations: Translation[];
}

function hindi(cat: Category): string {
  return cat.translations.find((t) => t.locale === 'hi')?.name ?? '';
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [hindiName, setHindiName] = useState('');
  // nextSort is fetched from backend; null = loading, undefined = fetch failed.
  const [nextSort, setNextSort] = useState<number | null | undefined>(null);
  const [iconUrl, setIconUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [busy, setBusy] = useState(false);

  // edit modal state
  const [editing, setEditing] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editHindi, setEditHindi] = useState('');
  const [editSort, setEditSort] = useState('0');
  const [editIcon, setEditIcon] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editBusy, setEditBusy] = useState(false);

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

  const loadNextSort = useCallback(async () => {
    try {
      const r = await api<{ sortOrder: number }>('/admin/categories/next-sort-order');
      setNextSort(r.sortOrder);
    } catch {
      setNextSort(undefined); // failed — show manual fallback
    }
  }, []);

  const load = useCallback(async () => {
    try {
      setCategories(await api<Category[]>('/admin/categories'));
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
    void loadNextSort();
  }, [router, load, loadNextSort]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/admin/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          // Omit sortOrder — backend auto-assigns via nextSortOrder() (max+1).
          iconUrl: iconUrl.trim() || undefined,
          coverImageUrl: coverImageUrl.trim() || undefined,
          translations: hindiName.trim()
            ? [{ locale: 'hi', name: hindiName.trim() }]
            : [],
        }),
      });
      setName('');
      setHindiName('');
      setIconUrl('');
      setCoverImageUrl('');
      toast.success('Category added');
      // Reload list and refresh the next sort order preview.
      await Promise.all([load(), loadNextSort()]);
    } catch (err) {
      handleError(err);
    } finally {
      setBusy(false);
    }
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setEditName(cat.name);
    setEditHindi(hindi(cat));
    setEditSort(String(cat.sortOrder));
    setEditIcon(cat.iconUrl ?? '');
    setEditCover(cat.coverImageUrl ?? '');
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditBusy(true);
    try {
      await api(`/admin/categories/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          sortOrder: Number(editSort) || 0,
          iconUrl: editIcon.trim() || undefined,
          coverImageUrl: editCover.trim() || undefined,
          translations: editHindi.trim()
            ? [{ locale: 'hi', name: editHindi.trim() }]
            : [],
        }),
      });
      toast.success('Category updated');
      setEditing(null);
      await load();
    } catch (err) {
      handleError(err);
    } finally {
      setEditBusy(false);
    }
  }

  async function onToggleHide(cat: Category) {
    const action = cat.isHidden ? 'unhide' : 'hide';
    const label = cat.isHidden ? 'Restored' : 'Hidden';
    if (!cat.isHidden && !window.confirm(`Hide “${cat.name}”? It will no longer appear to buyers.`)) return;
    try {
      await api(`/admin/categories/${cat.id}/${action}`, { method: 'PATCH' });
      toast.success(`${label} “${cat.name}”`);
      await load();
    } catch (err) {
      handleError(err);
    }
  }

  return (
    <>
      <div className="page-head">
        <h1>Categories</h1>
        <p className="subtitle">
          The catalog tree buyers browse. Hindi names power the bilingual UI.
        </p>
      </div>

      <div className="card">
        <h2>Add a category</h2>
        <form onSubmit={onCreate}>
          <div className="row">
            <div>
              <label>Name (English)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cement"
                required
              />
            </div>
            <div>
              <label>Name (Hindi)</label>
              <input
                value={hindiName}
                onChange={(e) => setHindiName(e.target.value)}
                placeholder="सीमेंट"
              />
            </div>
            <div style={{ maxWidth: 130 }}>
              <label title="Auto-assigned by the backend (max existing + 1)">
                Sort order (auto)
              </label>
              <input
                type="number"
                value={nextSort !== null && nextSort !== undefined ? nextSort : ''}
                disabled
                placeholder={nextSort === null ? 'Loading…' : 'Error'}
                style={{ opacity: 0.65, cursor: 'not-allowed' }}
              />
            </div>
          </div>
          <label>Icon URL (optional)</label>
          <input
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="https://…/cement-icon.png"
          />
          <label>Cover image URL (optional)</label>
          <input
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://…/cement-cover.jpg"
          />
          <button className="primary mt" type="submit" disabled={busy}>
            <Plus />
            {busy ? 'Adding…' : 'Add category'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>All categories</h2>
        {categories.length === 0 ? (
          <div className="empty">
            <FolderTree />
            <span>No categories yet. Add your first one above.</span>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name (EN)</th>
                  <th>Name (HI)</th>
                  <th>Sort</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id} style={{ opacity: cat.isHidden ? 0.55 : 1 }}>
                    <td style={{ fontWeight: 550 }}>{cat.name}</td>
                    <td>{hindi(cat) || <span className="muted">—</span>}</td>
                    <td>{cat.sortOrder}</td>
                    <td>
                      <span className={`badge ${cat.isHidden ? 'inactive' : 'active'}`}>
                        {cat.isHidden ? 'Hidden' : 'Visible'}
                      </span>
                    </td>
                    <td>
                      <div className="actions" style={{ justifyContent: 'flex-end' }}>
                        <button className="sm" onClick={() => openEdit(cat)}>
                          <Pencil />
                          Edit
                        </button>
                        <button
                          className={cat.isHidden ? 'primary sm' : 'danger sm'}
                          onClick={() => onToggleHide(cat)}
                        >
                          {cat.isHidden ? <Eye /> : <EyeOff />}
                          {cat.isHidden ? 'Restore' : 'Hide'}
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

      <Modal
        open={editing !== null}
        title="Edit category"
        onClose={() => setEditing(null)}
      >
        <form onSubmit={onSaveEdit}>
          <label>Name (English)</label>
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            autoFocus
          />
          <label>Name (Hindi)</label>
          <input
            value={editHindi}
            onChange={(e) => setEditHindi(e.target.value)}
            placeholder="सीमेंट"
          />
          <label>Sort order</label>
          <input
            type="number"
            value={editSort}
            onChange={(e) => setEditSort(e.target.value)}
          />
          <label>Icon URL (optional)</label>
          <input
            value={editIcon}
            onChange={(e) => setEditIcon(e.target.value)}
            placeholder="https://…/cement-icon.png"
          />
          <label>Cover image URL (optional)</label>
          <input
            value={editCover}
            onChange={(e) => setEditCover(e.target.value)}
            placeholder="https://…/cement-cover.jpg"
          />
          <div className="modal-foot">
            <button type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button className="primary" type="submit" disabled={editBusy}>
              {editBusy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
