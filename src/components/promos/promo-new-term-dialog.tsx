'use client';

import { useEffect, useState, useTransition } from 'react';
import { PromoDiscountTypeField } from '@/components/promos/promo-discount-type-field';
import { PromoDiscountValueField } from '@/components/promos/promo-discount-value-field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import { istLocalInputToRFC3339, splitISTInputDefaults } from '@/lib/ist-datetime';
import {
  promoDiscountFromFormValue,
  promoDiscountToFormValue,
  type PromoDiscountType,
  validatePromoDiscountFormValue,
} from '@/lib/promo-discount';
import type { PromoTerm, PromoTermInput } from '@/utils/api';

type PromoNewTermDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTerm: PromoTerm | null | undefined;
  onSubmit: (input: PromoTermInput) => Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
};

export function PromoNewTermDialog({
  open,
  onOpenChange,
  sourceTerm,
  onSubmit,
  title = 'Start new term',
  description = 'Set the offer for the next term. Any open-ended current term will be closed automatically.',
  confirmLabel = 'Create term',
}: PromoNewTermDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [discountType, setDiscountType] = useState<PromoDiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (!open || !sourceTerm) return;

    const now = splitISTInputDefaults();
    setDiscountType(sourceTerm.discount_type === 'fixed' ? 'fixed' : 'percent');
    setDiscountValue(promoDiscountToFormValue(sourceTerm.discount_type, sourceTerm.discount_value) || '10');
    setStartDate(now.date);
    setStartTime(now.time);
    setEndDate('');
    setEndTime('');
  }, [open, sourceTerm]);

  const handleDiscountTypeChange = (next: PromoDiscountType) => {
    setDiscountType(next);
    setDiscountValue(next === 'fixed' ? '1000' : '10');
  };

  const handleSubmit = () => {
    const formValue = Number(discountValue);
    const validationError = validatePromoDiscountFormValue(discountType, formValue);
    if (validationError) {
      toast({ message: validationError, variant: 'error' });
      return;
    }

    const input: PromoTermInput = {
      discount_type: discountType,
      discount_value: promoDiscountFromFormValue(discountType, formValue),
      applies_to: sourceTerm?.applies_to ?? 'upfront',
      program_slug: sourceTerm?.program_slug ?? 'take-control',
      starts_at: istLocalInputToRFC3339(startDate, startTime),
      ends_at: endDate.trim() ? istLocalInputToRFC3339(endDate, endTime || '23:59') : null,
    };

    if (!Number.isFinite(input.discount_value) || input.discount_value <= 0) {
      toast({ message: 'Discount must be positive.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        await onSubmit(input);
        onOpenChange(false);
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to create promo term.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="gap-1 border-b border-slate-100 px-6 py-5 pr-12">
          <DialogTitle className="text-lg font-bold text-slate-900">{title}</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">{description}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">Discount</p>
              <div className="mt-3 space-y-4">
                <PromoDiscountTypeField value={discountType} onChange={handleDiscountTypeChange} />
                <PromoDiscountValueField
                  discountType={discountType}
                  value={discountValue}
                  onChange={setDiscountValue}
                />
              </div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
              <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">Schedule (IST)</p>
              <div className="mt-3 space-y-4">
                <Field label="Start" hint="Required">
                  <div className="space-y-2">
                    <TextInput type="date" value={startDate} onChange={setStartDate} className="w-full" />
                    <TextInput type="time" value={startTime} onChange={setStartTime} className="w-full max-w-40" />
                  </div>
                </Field>
                <Field label="End (optional)" hint="Leave blank to keep active until you deactivate it.">
                  <div className="space-y-2">
                    <TextInput type="date" value={endDate} onChange={setEndDate} className="w-full" />
                    <TextInput type="time" value={endTime} onChange={setEndTime} className="w-full max-w-40" />
                  </div>
                </Field>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="mx-0 mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
          <Button type="button" variant="light" size="sm" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={pending}
            loadingLabel="Saving…"
            onClick={handleSubmit}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
