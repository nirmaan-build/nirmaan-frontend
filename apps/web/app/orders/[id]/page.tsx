'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthGuard } from '@/lib/useAuthGuard';
import {
  useOrderTimeline,
  useAdvanceOrder,
  useRaiseDispute,
  type OrderStatusEventRow,
} from '@/lib/queries';
import { useT } from '@/lib/i18n-client';
import { money } from '@/lib/format';
import { SkeletonList } from '../../components/Skeleton';

const NEXT: Record<string, string | undefined> = {
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'DISPATCHED',
  DISPATCHED: 'DELIVERED',
};

/** Order Tracking (PRD-03 §4.8) — vertical timeline; supplier advances one
 *  step; buyer gets tap-to-call once dispatched. Pull/refresh via React Query. */
export default function OrderTrackingPage() {
  const t = useT();
  const { ready } = useAuthGuard();
  const params = useParams();
  const orderId = String(params.id);
  const { data, isLoading } = useOrderTimeline(orderId);
  const advance = useAdvanceOrder();
  const raise = useRaiseDispute();
  const [note, setNote] = useState('');
  const [issueOpen, setIssueOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [desc, setDesc] = useState('');

  if (!ready || isLoading || !data) {
    return (
      <>
        <h1 className="page-title">{t('tracking.title')}</h1>
        <SkeletonList rows={3} />
      </>
    );
  }

  const next = NEXT[data.status];
  const dispatched = data.status === 'DISPATCHED' || data.status === 'DELIVERED';

  const onAdvance = async () => {
    if (!next) return;
    try {
      await advance.mutateAsync({
        orderId,
        status: next,
        note: next === 'DISPATCHED' ? note.trim() || undefined : undefined,
      });
      setNote('');
      toast.success(t('tracking.advanced', { status: t(`orderStatus.${next}`) }));
    } catch {
      toast.error(t('common.somethingWrong'));
    }
  };

  const onRaise = async () => {
    if (!reason.trim()) return;
    try {
      await raise.mutateAsync({
        orderId,
        reason: reason.trim(),
        description: desc.trim() || undefined,
      });
      setReason('');
      setDesc('');
      setIssueOpen(false);
      toast.success(t('dispute.followUp'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('common.somethingWrong'));
    }
  };

  return (
    <>
      <h1 className="page-title">{data.supplierName}</h1>
      <div className="meta">{money(data.totalAmount)}</div>

      <div className="card">
        {data.events.length === 0 ? (
          <div className="meta">{t('tracking.empty')}</div>
        ) : (
          data.events.map((e: OrderStatusEventRow) => (
            <div key={e.id} style={{ marginBottom: 12 }}>
              <strong>{t(`orderStatus.${e.status}`)}</strong>
              <div className="meta">{new Date(e.occurredAt).toLocaleString()}</div>
              {e.note ? <div className="meta">{e.note}</div> : null}
            </div>
          ))
        )}
      </div>

      {data.isSupplier && next ? (
        <div className="card">
          {next === 'DISPATCHED' ? (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('tracking.notePlaceholder')}
            />
          ) : null}
          <button
            className="primary"
            style={{ marginTop: 12 }}
            onClick={onAdvance}
            disabled={advance.isPending}
          >
            {t('tracking.advanceTo', { status: t(`orderStatus.${next}`) })}
          </button>
        </div>
      ) : null}

      {!data.isSupplier && dispatched ? (
        data.supplierPhone ? (
          <a
            className="card"
            href={`tel:${data.supplierPhone}`}
            style={{ display: 'block' }}
          >
            {t('tracking.callSupplier')}
          </a>
        ) : (
          <div className="meta">{t('tracking.noPhone')}</div>
        )
      ) : null}

      {!data.isSupplier ? (
        <div className="card">
          {issueOpen ? (
            <>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('dispute.reasonPlaceholder')}
              />
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={t('dispute.description')}
              />
              <button
                className="primary"
                style={{ marginTop: 12 }}
                onClick={onRaise}
                disabled={raise.isPending || !reason.trim()}
              >
                {t('dispute.submit')}
              </button>
            </>
          ) : (
            <button onClick={() => setIssueOpen(true)}>
              {t('dispute.raise')}
            </button>
          )}
        </div>
      ) : null}
    </>
  );
}
