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
  const [discountValue, setDiscountValue] = useState(String(current?.discount_value ?? 10));
  const [startDate, setStartDate] = useState(isoToISTDateInput(current?.starts_at) || defaults.date);
  const [startTime, setStartTime] = useState(isoToISTTimeInput(current?.starts_at) || defaults.time);
  const [endDate, setEndDate] = useState(isoToISTDateInput(current?.ends_at));
  const [endTime, setEndTime] = useState(isoToISTTimeInput(current?.ends_at));
  const [maxRedemptions, setMaxRedemptions] = useState(
    current?.max_redemptions != null ? String(current.max_redemptions) : ''
  );
  const [showNewTerm, setShowNewTerm] = useState(false);

  const buildTermInput = () => ({
    discount_type: current?.discount_type ?? 'percent',
    discount_value: Number(discountValue),
    applies_to: current?.applies_to ?? 'upfront',
    program_slug: current?.program_slug ?? 'take-control',
    starts_at: istLocalInputToRFC3339(startDate, startTime),
    ends_at: endDate.trim() ? istLocalInputToRFC3339(endDate, endTime || '23:59') : null,
    max_redemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
  });

  const handleSave = () => {
    if (!current) return;
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
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Discount (%)">
            <TextInput
              value={discountValue}
              onChange={setDiscountValue}
              inputMode="numeric"
              disabled={!canEditInPlace && !showNewTerm}
            />
          </Field>
          <Field label="Max redemptions (optional)">
            <TextInput
              value={maxRedemptions}
              onChange={setMaxRedemptions}
              inputMode="numeric"
              disabled={!canEditInPlace && !showNewTerm}
            />
          </Field>
          <Field label="Start (IST)">
            <div className="flex gap-2">
              <TextInput
                type="date"
                value={startDate}
                onChange={setStartDate}
                disabled={!canEditInPlace && !showNewTerm}
              />
              <TextInput
                type="time"
                value={startTime}
                onChange={setStartTime}
                disabled={!canEditInPlace && !showNewTerm}
              />
            </div>
          </Field>
          <Field label="End (IST, optional)" hint="Leave blank for open-ended promos.">
            <div className="flex gap-2">
              <TextInput type="date" value={endDate} onChange={setEndDate} disabled={!canEditInPlace && !showNewTerm} />
              <TextInput type="time" value={endTime} onChange={setEndTime} disabled={!canEditInPlace && !showNewTerm} />
            </div>
          </Field>
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
            <DataTableRow>
              <DataTableHeaderCell>Type</DataTableHeaderCell>
              <DataTableHeaderCell>When (IST)</DataTableHeaderCell>
              <DataTableHeaderCell>Details</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {promo.events.map((event) => (
              <DataTableRow key={event.id}>
                <DataTableCell className="font-medium capitalize">{event.event_type.replace('_', ' ')}</DataTableCell>
                <DataTableCell className="text-xs">{formatDateTimeIST(event.occurred_at)}</DataTableCell>
                <DataTableCell className="text-xs text-slate-600">
                  {event.snapshot.discount_value != null ? `${String(event.snapshot.discount_value)}%` : '—'}
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
            <DataTableRow>
              <DataTableHeaderCell>Member</DataTableHeaderCell>
              <DataTableHeaderCell>Status</DataTableHeaderCell>
              <DataTableHeaderCell>Applied (IST)</DataTableHeaderCell>
              <DataTableHeaderCell>Redeemed (IST)</DataTableHeaderCell>
              <DataTableHeaderCell>Discount</DataTableHeaderCell>
            </DataTableRow>
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
