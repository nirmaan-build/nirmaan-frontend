'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { AreaPicker } from '../../components/AreaPicker';
import { useAuthGuard } from '@/lib/useAuthGuard';
import {
  useActiveAreas,
  useCategories,
  useCreateRfq,
  useUnits,
  useRequestUnit,
} from '@/lib/queries';
import { useT, useLocale } from '@/lib/i18n-client';
import { getUser } from '@/lib/cookies';
import { ApiError } from '@/lib/clientApi';

function PostRfqForm() {
  const router = useRouter();
  const t = useT();
  const { locale } = useLocale();
  const { ready } = useAuthGuard();
  const params = useSearchParams();
  const categories = useCategories(locale);
  const units = useUnits(locale);
  const requestUnit = useRequestUnit();
  const { data: areas } = useActiveAreas();
  const createRfq = useCreateRfq();

  const [categoryId, setCategoryId] = useState(params.get('category') ?? '');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitId, setUnitId] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [pincode, setPincode] = useState(getUser()?.primaryPincode ?? '');

  if (!ready) return <p className="muted">{t('common.loading')}</p>;

  const canSubmit =
    categoryId && description.trim() && Number(quantity) > 0 && unitId && pincode;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      const rfq = await createRfq.mutateAsync({
        categoryId,
        pincode,
        description: description.trim(),
        quantity: Number(quantity),
        unitId,
      });
      router.replace(`/rfq/${rfq.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    }
  };

  // Requesting a new unit NEVER blocks the form (PRD-02 §3.8.1 / PRD-03): it
  // just logs the ask; the buyer still picks the closest existing unit.
  const requestNewUnit = async () => {
    const raw = newUnit.trim();
    if (!raw) return;
    try {
      await requestUnit.mutateAsync({ rawText: raw, context: 'rfq' });
    } catch {
      /* swallow — must not block picking a unit */
    }
    setNewUnit('');
    toast.success(t('units.requested'));
  };

  return (
    <>
      <h1 className="page-title">{t('postRfq.title')}</h1>
      <div className="card">
        <label>{t('postRfq.categoryLabel')}</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">{t('postRfq.categoryLabel')}</option>
          {(categories.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label>{t('postRfq.descriptionLabel')}</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('postRfq.descriptionPlaceholder')}
        />

        <div className="row">
          <div>
            <label>{t('postRfq.quantityLabel')}</label>
            <input
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label>{t('postRfq.unitLabel')}</label>
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)}>
              <option value="">{t('units.pickerTitle')}</option>
              {(units.data ?? []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Request a new unit — informational only, never blocks (§3.8.1). */}
        <div className="row" style={{ marginTop: 8 }}>
          <div style={{ flex: 1 }}>
            <label>{t('units.requestNew')}</label>
            <input
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder={t('units.requestPlaceholder')}
            />
          </div>
          <button
            type="button"
            onClick={requestNewUnit}
            disabled={!newUnit.trim() || requestUnit.isPending}
            style={{ alignSelf: 'flex-end' }}
          >
            {t('units.requestCta')}
          </button>
        </div>

        <label>{t('postRfq.areaLabel')}</label>
        <AreaPicker
          areas={areas ?? []}
          value={pincode}
          onChange={setPincode}
          placeholder={t('postRfq.areaLabel')}
        />

        <button
          className="primary"
          style={{ marginTop: 16 }}
          onClick={submit}
          disabled={!canSubmit || createRfq.isPending}
        >
          <Send size={17} />
          {createRfq.isPending ? t('postRfq.submitting') : t('postRfq.submit')}
        </button>
      </div>
    </>
  );
}

export default function PostRfqPage() {
  return (
    <Suspense fallback={null}>
      <PostRfqForm />
    </Suspense>
  );
}
