'use client';

import { useMemo, useState, useTransition } from 'react';
import { createPromoTermAction, deactivatePromoAction, updatePromoTermAction } from '@/app/(crm)/promos/actions';
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from '@/components/crm/data-table';
import { PromoDiscountTypeField } from '@/components/promos/promo-discount-type-field';
import { PromoDiscountValueField } from '@/components/promos/promo-discount-value-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import {
  formatDateTimeIST,
  isoToISTDateInput,
  isoToISTTimeInput,
  istLocalInputToRFC3339,
  splitISTInputDefaults,
} from '@/lib/ist-datetime';
import {
  formatPromoDiscount,
  formatPromoDiscountFromSnapshot,
  promoDiscountFromFormValue,
  promoDiscountToFormValue,
  promoDiscountTypeLabel,
  type PromoDiscountType,
  validatePromoDiscountFormValue,
} from '@/lib/promo-discount';
import type { PromoDetail } from '@/utils/api';

type PromoDetailViewProps = {
  promo: PromoDetail;
};

function formatInrFromPaise(paise: number | null | undefined): string {
  if (paise == null) return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    paise / 100
  );
}

export function PromoDetailView({ promo }: PromoDetailViewProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const current = promo.current_term ?? promo.terms[0];
  const usageCount = promo.usages.length;
  const termUsageCount = useMemo(
    () => (current ? promo.usages.filter((usage) => usage.term_id === current.id).length : 0),
    [current, promo.usages]
  );
  const canEditInPlace = termUsageCount === 0 && current != null;

  const defaults = splitISTInputDefaults();
  const [discountType, setDiscountType] = useState<PromoDiscountType>(
    current?.discount_type === 'fixed' ? 'fixed' : 'percent'
  );
  const [discountValue, setDiscountValue] = useState(
    promoDiscountToFormValue(current?.discount_type, current?.discount_value) || '10'
  );
  const [startDate, setStartDate] = useState(isoToISTDateInput(current?.starts_at) || defaults.date);
  const [startTime, setStartTime] = useState(isoToISTTimeInput(current?.starts_at) || defaults.time);
  const [endDate, setEndDate] = useState(isoToISTDateInput(current?.ends_at));
  const [endTime, setEndTime] = useState(isoToISTTimeInput(current?.ends_at));
  const [maxRedemptions, setMaxRedemptions] = useState(
    current?.max_redemptions != null ? String(current.max_redemptions) : ''
  );
  const [showNewTerm, setShowNewTerm] = useState(false);
  const canEditDiscountFields = canEditInPlace || showNewTerm;

  const handleDiscountTypeChange = (next: PromoDiscountType) => {
    setDiscountType(next);
    setDiscountValue(next === 'fixed' ? '1000' : '10');
  };

  const buildTermInput = () => {
    const formValue = Number(discountValue);
    return {
      discount_type: discountType,
      discount_value: promoDiscountFromFormValue(discountType, formValue),
      applies_to: current?.applies_to ?? 'upfront',
      program_slug: current?.program_slug ?? 'take-control',
      starts_at: istLocalInputToRFC3339(startDate, startTime),
      ends_at: endDate.trim() ? istLocalInputToRFC3339(endDate, endTime || '23:59') : null,
      max_redemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
    };
  };

  const handleSave = () => {
    if (!current) return;
    const formValue = Number(discountValue);
    const validationError = validatePromoDiscountFormValue(discountType, formValue);
    if (validationError) {
      toast({ message: validationError, variant: 'error' });
      return;
    }

    const input = buildTermInput();
    if (!Number.isFinite(input.discount_value) || input.discount_value <= 0) {
      toast({ message: 'Discount must be positive.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        if (canEditInPlace && !showNewTerm) {
          await updatePromoTermAction(promo.id, current.id, input);
          toast({ message: 'Promo term updated.', variant: 'success' });
        } else {
          await createPromoTermAction(promo.id, input);
          toast({ message: 'New promo term created.', variant: 'success' });
          setShowNewTerm(false);
        }
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to save promo term.',
          variant: 'error',
        });
      }
    });
  };

  const handleDeactivate = () => {
    startTransition(async () => {
      try {
        await deactivatePromoAction(promo.id);
        toast({ message: 'Promo deactivated.', variant: 'success' });
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to deactivate promo.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionHead title={promo.code} subtitle={`Created ${formatDateTimeIST(promo.created_at)}`} />
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill tone={promo.summary.status === 'active' ? 'success' : 'neutral'}>{promo.summary.status}</Pill>
              {current ? (
                <Pill tone="brand">{formatPromoDiscount(current.discount_type, current.discount_value)}</Pill>
              ) : null}
              {current ? <Pill tone="neutral">{promoDiscountTypeLabel(current.discount_type)}</Pill> : null}
              <Pill tone="brand">{promo.summary.applied_count} applied</Pill>
              <Pill tone="deep">{promo.summary.redeemed_count} redeemed</Pill>
            </div>
          </div>
          {promo.summary.status === 'active' || promo.summary.status === 'scheduled' ? (
            <Button type="button" variant="light" size="md" disabled={pending} onClick={handleDeactivate}>
              Deactivate
            </Button>
          ) : null}
        </div>
      </Card>

      <Card className="p-5">
        <SectionHead
          title="Current offer"
          subtitle={
            canEditInPlace && !showNewTerm
              ? 'No usages yet — you can edit in place.'
              : 'Usages exist — start a new term to change the offer.'
          }
        />
        <div className="mt-4 grid gap-5 lg:grid-cols-2 lg:items-start">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">Discount</p>
            <div className="mt-3 space-y-4">
              {canEditDiscountFields ? (
                <PromoDiscountTypeField value={discountType} onChange={handleDiscountTypeChange} />
              ) : (
                <Field label="Discount type">
                  <p className="text-sm font-medium text-slate-700">{promoDiscountTypeLabel(current?.discount_type)}</p>
                </Field>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <PromoDiscountValueField
                  discountType={
                    canEditDiscountFields ? discountType : current?.discount_type === 'fixed' ? 'fixed' : 'percent'
                  }
                  value={discountValue}
                  onChange={setDiscountValue}
                  disabled={!canEditDiscountFields}
                  className="max-w-44 lg:max-w-none"
                />
                <Field label="Max redemptions (optional)">
                  <TextInput
                    value={maxRedemptions}
                    onChange={setMaxRedemptions}
                    inputMode="numeric"
                    disabled={!canEditDiscountFields}
                    placeholder="Unlimited"
                    className="max-w-44 lg:max-w-none"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">Schedule (IST)</p>
            <div className="mt-3 space-y-4">
              <Field label="Start">
                <div className="flex gap-2">
                  <TextInput
                    type="date"
                    value={startDate}
                    onChange={setStartDate}
                    disabled={!canEditDiscountFields}
                    className="min-w-0 flex-1"
                  />
                  <TextInput
                    type="time"
                    value={startTime}
                    onChange={setStartTime}
                    disabled={!canEditDiscountFields}
                    className="w-34 min-w-0 shrink-0"
                  />
                </div>
              </Field>
              <Field label="End (optional)" hint="Leave blank for open-ended promos.">
                <div className="flex gap-2">
                  <TextInput
                    type="date"
                    value={endDate}
                    onChange={setEndDate}
                    disabled={!canEditDiscountFields}
                    className="min-w-0 flex-1"
                  />
                  <TextInput
                    type="time"
                    value={endTime}
                    onChange={setEndTime}
                    disabled={!canEditDiscountFields}
                    className="w-34 min-w-0 shrink-0"
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {canEditInPlace && !showNewTerm ? (
            <Button type="button" variant="primary" size="md" disabled={pending} onClick={handleSave}>
              Save changes
            </Button>
          ) : (
            <>
              {!showNewTerm ? (
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  disabled={pending}
                  onClick={() => setShowNewTerm(true)}
                >
                  Start new term
                </Button>
              ) : (
                <>
                  <Button type="button" variant="primary" size="md" disabled={pending} onClick={handleSave}>
                    Create new term
                  </Button>
                  <Button
                    type="button"
                    variant="light"
                    size="md"
                    disabled={pending}
                    onClick={() => setShowNewTerm(false)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHead title="History" subtitle="Terms and audit events" />
        </div>
        <DataTable>
          <DataTableHead>
            <DataTableHeaderCell>Type</DataTableHeaderCell>
            <DataTableHeaderCell>When (IST)</DataTableHeaderCell>
            <DataTableHeaderCell>Details</DataTableHeaderCell>
          </DataTableHead>
          <DataTableBody>
            {promo.events.map((event) => (
              <DataTableRow key={event.id}>
                <DataTableCell className="font-medium capitalize">{event.event_type.replace('_', ' ')}</DataTableCell>
                <DataTableCell className="text-xs">{formatDateTimeIST(event.occurred_at)}</DataTableCell>
                <DataTableCell className="text-xs text-slate-600">
                  {formatPromoDiscountFromSnapshot(event.snapshot)}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-slate-100 px-5 py-4">
          <SectionHead title="Usage" subtitle={`${usageCount} checkout applications`} />
        </div>
        <DataTable>
          <DataTableHead>
            <DataTableHeaderCell>Member</DataTableHeaderCell>
            <DataTableHeaderCell>Status</DataTableHeaderCell>
            <DataTableHeaderCell>Applied (IST)</DataTableHeaderCell>
            <DataTableHeaderCell>Redeemed (IST)</DataTableHeaderCell>
            <DataTableHeaderCell>Discount</DataTableHeaderCell>
          </DataTableHead>
          <DataTableBody>
            {promo.usages.length === 0 ? (
              <DataTableRow>
                <DataTableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  No usages yet.
                </DataTableCell>
              </DataTableRow>
            ) : (
              promo.usages.map((usage) => (
                <DataTableRow key={usage.id}>
                  <DataTableCell>{usage.user_email || '—'}</DataTableCell>
                  <DataTableCell>
                    <Pill
                      tone={usage.status === 'redeemed' ? 'success' : usage.status === 'applied' ? 'warn' : 'neutral'}
                    >
                      {usage.status}
                    </Pill>
                  </DataTableCell>
                  <DataTableCell className="text-xs">{formatDateTimeIST(usage.applied_at)}</DataTableCell>
                  <DataTableCell className="text-xs">{formatDateTimeIST(usage.redeemed_at)}</DataTableCell>
                  <DataTableCell>{formatInrFromPaise(usage.discount_paise)}</DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>
      </Card>
    </div>
  );
}
