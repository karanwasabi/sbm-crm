'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createPromoAction } from '@/app/(crm)/promos/actions';
import { PromoDiscountTypeField } from '@/components/promos/promo-discount-type-field';
import { PromoDiscountValueField } from '@/components/promos/promo-discount-value-field';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import { istLocalInputToRFC3339, splitISTInputDefaults } from '@/lib/ist-datetime';
import {
  promoDiscountFromFormValue,
  type PromoDiscountType,
  validatePromoDiscountFormValue,
} from '@/lib/promo-discount';

export function PromoCreateView() {
  const router = useRouter();
  const { toast } = useToast();
  const defaults = splitISTInputDefaults();
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<PromoDiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [startDate, setStartDate] = useState(defaults.date);
  const [startTime, setStartTime] = useState(defaults.time);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [pending, startTransition] = useTransition();

  const handleDiscountTypeChange = (next: PromoDiscountType) => {
    setDiscountType(next);
    setDiscountValue(next === 'fixed' ? '1000' : '10');
  };

  const handleSubmit = () => {
    const trimmedCode = code.trim().toUpperCase();
    const value = Number(discountValue);
    const validationError = validatePromoDiscountFormValue(discountType, value);
    if (!trimmedCode) {
      toast({ message: 'Promo code is required.', variant: 'error' });
      return;
    }
    if (validationError) {
      toast({ message: validationError, variant: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        const result = await createPromoAction({
          code: trimmedCode,
          discount_type: discountType,
          discount_value: promoDiscountFromFormValue(discountType, value),
          applies_to: 'upfront',
          program_slug: 'take-control',
          starts_at: istLocalInputToRFC3339(startDate, startTime),
          ends_at: endDate.trim() ? istLocalInputToRFC3339(endDate, endTime || '23:59') : null,
          max_redemptions: maxRedemptions.trim() ? Number(maxRedemptions) : null,
        });
        toast({ message: `Created promo ${result.code}`, variant: 'success' });
        router.push(`/promos/${result.id}`);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to create promo code.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <Card className="max-w-5xl p-5">
      <SectionHead title="New promo code" subtitle="Take Control upfront discount (IST windows)" />
      <div className="mt-5 space-y-5">
        <Field label="Code">
          <TextInput value={code} onChange={setCode} placeholder="WELCOME10" className="max-w-md" />
        </Field>

        <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
          <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[11px] font-bold tracking-[0.12em] text-slate-500 uppercase">Discount</p>
            <div className="mt-3 space-y-4">
              <PromoDiscountTypeField value={discountType} onChange={handleDiscountTypeChange} />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <PromoDiscountValueField
                  discountType={discountType}
                  value={discountValue}
                  onChange={setDiscountValue}
                  className="max-w-44 lg:max-w-none"
                />
                <Field label="Max redemptions (optional)">
                  <TextInput
                    value={maxRedemptions}
                    onChange={setMaxRedemptions}
                    inputMode="numeric"
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
              <Field label="Start" hint="Required">
                <div className="flex gap-2">
                  <TextInput type="date" value={startDate} onChange={setStartDate} className="min-w-0 flex-1" />
                  <TextInput type="time" value={startTime} onChange={setStartTime} className="w-34 min-w-0 shrink-0" />
                </div>
              </Field>
              <Field label="End (optional)" hint="Leave blank to keep active until you deactivate it.">
                <div className="flex gap-2">
                  <TextInput type="date" value={endDate} onChange={setEndDate} className="min-w-0 flex-1" />
                  <TextInput type="time" value={endTime} onChange={setEndTime} className="w-34 min-w-0 shrink-0" />
                </div>
              </Field>
            </div>
          </div>
        </div>

        <Button type="button" variant="primary" size="md" disabled={pending} onClick={handleSubmit}>
          {pending ? 'Creating…' : 'Create promo code'}
        </Button>
      </div>
    </Card>
  );
}
