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
  const [unitExistsWarning, setUnitExistsWarning] = useState(false);
  const [unitFormatError, setUnitFormatError] = useState(false);
  const [pincode, setPincode] = useState(getUser()?.primaryPincode ?? '');

  if (!ready) return <p className="muted">{t('common.loading')}</p>;

  const quantityNum = parseFloat(quantity);
  const canSubmit =
    categoryId &&
    description.trim() &&
    quantity !== '' &&
    !isNaN(quantityNum) &&
    isFinite(quantityNum) &&
    quantityNum > 0 &&
    unitId &&
    pincode;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      const rfq = await createRfq.mutateAsync({
        categoryId,
        pincode,
        description: description.trim(),
        quantity: quantityNum,
        unitId,
      });
      router.replace(`/rfq/${rfq.id}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('common.somethingWrong'));
    }
  };

  // Requesting a new unit NEVER blocks the form (PRD-02 §3.8.1 / PRD-03): it
  // just logs the ask; the buyer still picks the closest existing unit.
  const ALPHA_RE = /^[a-zA-Z\s]+$/;

  const requestNewUnit = async () => {
    const raw = newUnit.trim();
    if (!raw) return;
    if (!ALPHA_RE.test(raw)) {
      setUnitFormatError(true);
      return;
    }
    // Guard: don't accept a name that already exists in the units list.
    const alreadyExists = (units.data ?? []).some(
      (u) => u.name.toLowerCase() === raw.toLowerCase(),
    );
    if (alreadyExists) {
      setUnitExistsWarning(true);
      return; // no request sent to backend
    }
    setUnitExistsWarning(false);
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
              inputMode="decimal"
              value={quantity}
              onChange={(e) => {
                // Allow digits and at most one decimal point; cap at 10 chars.
                const v = e.target.value
                  .replace(/[^0-9.]/g, '')        // strip non-numeric except '.'
                  .replace(/^(\d*\.?\d*).*$/, '$1') // keep only first decimal
                  .slice(0, 10);
                setQuantity(v);
              }}
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
        <div style={{ marginTop: 8 }}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <label>{t('units.requestNew')}</label>
              <input
                value={newUnit}
                onChange={(e) => {
                  const v = e.target.value;
                  setNewUnit(v);
                  setUnitExistsWarning(false);
                  // Validate on each keystroke so error clears as user types
                  setUnitFormatError(v.length > 0 && !ALPHA_RE.test(v));
                }}
                placeholder={t('units.requestPlaceholder')}
              />
            </div>
            <button
              type="button"
              onClick={requestNewUnit}
              disabled={!newUnit.trim() || unitFormatError || requestUnit.isPending}
              style={{ alignSelf: 'flex-end' }}
            >
              {t('units.requestCta')}
            </button>
          </div>
          {unitFormatError && (
            <p style={{
              margin: '6px 0 0',
              fontSize: 13,
              color: 'var(--error, #dc2626)',
              background: 'var(--error-muted, #fef2f2)',
              borderRadius: 'var(--r-sm)',
              padding: '8px 12px',
            }}>
              {t('units.lettersOnly') || 'Only letters and spaces are allowed.'}
            </p>
          )}
          {unitExistsWarning && !unitFormatError && (
            <p style={{
              margin: '6px 0 0',
              fontSize: 13,
              color: 'var(--primary)',
              background: 'var(--primary-muted)',
              borderRadius: 'var(--r-sm)',
              padding: '8px 12px',
            }}>
              {t('units.alreadyExists')}
            </p>
          )}
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
