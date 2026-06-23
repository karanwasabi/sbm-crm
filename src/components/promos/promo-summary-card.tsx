'use client';

import { type ReactNode, useEffect, useState, useTransition } from 'react';
import { updatePromoDescriptionAction } from '@/app/(crm)/promos/actions';
import { PromoOfferDisplay, PromoWindowDisplay } from '@/components/promos/promo-display-cells';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { formatDateTimeIST } from '@/lib/ist-datetime';
import type { PromoDetail, PromoTerm } from '@/utils/api';

type PromoSummaryCardProps = {
  promo: PromoDetail;
  current: PromoTerm | undefined;
  pending: boolean;
  onStartNewTerm: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  canDelete: boolean;
  isActive: boolean;
};

function statusTone(status: string) {
  switch (status) {
    case 'active':
      return 'success' as const;
    case 'scheduled':
      return 'warn' as const;
    default:
      return 'neutral' as const;
  }
}

function promoCount(value: number | null | undefined): number {
  return value ?? 0;
}

function StatTile({ label, children, count = false }: { label: string; children: ReactNode; count?: boolean }) {
  return (
    <div className={cn('bg-white p-5', count && 'text-center')}>
      <p className={cn('text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase', count && 'text-center')}>
        {label}
      </p>
      <div className={cn('mt-2', count && 'text-center')}>{children}</div>
    </div>
  );
}

export function PromoSummaryCard({
  promo,
  current,
  pending,
  onStartNewTerm,
  onDeactivate,
  onDelete,
  canDelete,
  isActive,
}: PromoSummaryCardProps) {
  const { toast } = useToast();
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState(promo.description ?? '');
  const [description, setDescription] = useState(promo.description ?? '');
  const [savingDescription, startSaveDescription] = useTransition();

  useEffect(() => {
    const next = promo.description ?? '';
    setDescription(next);
    setDescriptionDraft(next);
  }, [promo.description]);

  const handleSaveDescription = () => {
    const trimmed = descriptionDraft.trim();
    startSaveDescription(async () => {
      try {
        const result = await updatePromoDescriptionAction(promo.id, trimmed || null);
        const next = result.description ?? '';
        setDescription(next);
        setDescriptionDraft(next);
        setEditingDescription(false);
        toast({ message: 'Description updated.', variant: 'success' });
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to update description.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-l-4 border-brand bg-gradient-to-r from-brand/6 via-white to-white px-6 py-6 lg:px-8 lg:py-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">{promo.code}</h1>
              <Pill tone={statusTone(promo.summary.status)}>{promo.summary.status}</Pill>
            </div>

            {editingDescription ? (
              <div className="max-w-3xl space-y-3">
                <Textarea
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  placeholder="Describe who this promo is for and when to use it."
                  rows={3}
                  className="min-h-24 resize-y bg-white text-sm leading-relaxed"
                  maxLength={1000}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={savingDescription}
                    onClick={handleSaveDescription}
                  >
                    {savingDescription ? 'Saving…' : 'Save description'}
                  </Button>
                  <Button
                    type="button"
                    variant="light"
                    size="sm"
                    disabled={savingDescription}
                    onClick={() => {
                      setDescriptionDraft(description);
                      setEditingDescription(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl space-y-2">
                {description ? (
                  <p className="text-base leading-relaxed text-slate-700">{description}</p>
                ) : (
                  <p className="text-base leading-relaxed text-slate-400 italic">No description yet.</p>
                )}
                <button
                  type="button"
                  className="text-sm font-semibold text-brand hover:underline"
                  onClick={() => {
                    setDescriptionDraft(description);
                    setEditingDescription(true);
                  }}
                >
                  {description ? 'Edit description' : 'Add description'}
                </button>
              </div>
            )}

            <p className="text-xs text-slate-400">Created {formatDateTimeIST(promo.created_at)}</p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {current ? (
              <Button type="button" variant="primary" size="sm" disabled={pending} onClick={onStartNewTerm}>
                Start new term
              </Button>
            ) : null}
            {isActive ? (
              <Button
                type="button"
                variant="light"
                size="sm"
                loading={pending}
                loadingLabel="Deactivating…"
                onClick={onDeactivate}
              >
                Deactivate
              </Button>
            ) : null}
            {canDelete ? (
              <Button type="button" variant="danger" size="sm" disabled={pending} onClick={onDelete}>
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {current ? (
        <div className="grid border-t border-slate-100 bg-slate-50/80 lg:grid-cols-4">
          <StatTile label="Current offer">
            <PromoOfferDisplay discountType={current.discount_type} discountValue={current.discount_value} />
          </StatTile>
          <StatTile label="Window (IST)">
            <PromoWindowDisplay startsAt={current.starts_at} endsAt={current.ends_at} />
          </StatTile>
          <StatTile label="Applied" count>
            <p className="font-heading text-3xl font-bold text-slate-900 tabular-nums">
              {promoCount(current.applied_count)}
            </p>
          </StatTile>
          <StatTile label="Redeemed" count>
            <p className="font-heading text-3xl font-bold text-slate-900 tabular-nums">
              {promoCount(current.redeemed_count)}
            </p>
          </StatTile>
        </div>
      ) : null}
    </Card>
  );
}
