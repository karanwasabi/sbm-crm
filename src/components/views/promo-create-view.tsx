'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { createPromoAction } from '@/app/(crm)/promos/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import { istLocalInputToRFC3339, splitISTInputDefaults } from '@/lib/ist-datetime';

export function PromoCreateView() {
  const router = useRouter();
  const { toast } = useToast();
  const defaults = splitISTInputDefaults();
  const [code, setCode] = useState('');
  const [discountValue, setDiscountValue] = useState('10');
  const [startDate, setStartDate] = useState(defaults.date);
  const [startTime, setStartTime] = useState(defaults.time);
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [pending, startTransition] = useTransition();

  const handleSubmit = () => {
    const trimmedCode = code.trim().toUpperCase();
    const value = Number(discountValue);
    if (!trimmedCode) {
      toast({ message: 'Promo code is required.', variant: 'error' });
      return;
    }
    if (!Number.isFinite(value) || value <= 0 || value > 100) {
      toast({ message: 'Discount must be between 1 and 100 percent.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      try {
        const result = await createPromoAction({
          code: trimmedCode,
          discount_type: 'percent',
          discount_value: value,
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
    <Card className="max-w-2xl p-5">
      <SectionHead title="New promo code" subtitle="Take Control upfront discount (IST windows)" />
      <div className="mt-5 space-y-4">
        <Field label="Code">
          <TextInput value={code} onChange={setCode} placeholder="WELCOME10" />
        </Field>
        <Field label="Discount (%)">
          <TextInput value={discountValue} onChange={setDiscountValue} inputMode="numeric" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Start (IST)" hint="Required">
            <div className="flex gap-2">
              <TextInput type="date" value={startDate} onChange={setStartDate} />
              <TextInput type="time" value={startTime} onChange={setStartTime} />
            </div>
          </Field>
          <Field label="End (IST, optional)" hint="Leave blank to keep active until you deactivate it.">
            <div className="flex gap-2">
              <TextInput type="date" value={endDate} onChange={setEndDate} />
              <TextInput type="time" value={endTime} onChange={setEndTime} />
            </div>
          </Field>
        </div>
        <Field label="Max redemptions (optional)">
          <TextInput value={maxRedemptions} onChange={setMaxRedemptions} inputMode="numeric" placeholder="Unlimited" />
        </Field>
        <Button type="button" variant="primary" size="md" disabled={pending} onClick={handleSubmit}>
          {pending ? 'Creating…' : 'Create promo code'}
        </Button>
      </div>
    </Card>
  );
}
