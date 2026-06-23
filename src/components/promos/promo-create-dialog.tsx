'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createPromoAction } from '@/app/(crm)/promos/actions';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import { istLocalInputToRFC3339, splitISTInputDefaults } from '@/lib/ist-datetime';
import {
  normalizePromoCode,
  normalizePromoCodeInput,
  promoCodeInputProps,
  PROMO_CODE_CHAR_HINT,
} from '@/lib/promo-code';
import {
  promoDiscountFromFormValue,
  type PromoDiscountType,
  validatePromoDiscountFormValue,
} from '@/lib/promo-discount';

type PromoCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function defaultFormState() {
  const now = splitISTInputDefaults();
  return {
    code: '',
    description: '',
    discountType: 'percent' as PromoDiscountType,
    discountValue: '10',
    startDate: now.date,
    startTime: now.time,
    endDate: '',
    endTime: '',
  };
}

export function PromoCreateDialog({ open, onOpenChange }: PromoCreateDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<PromoDiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (!open) return;
    const defaults = defaultFormState();
    setCode(defaults.code);
    setDescription(defaults.description);
    setDiscountType(defaults.discountType);
    setDiscountValue(defaults.discountValue);
    setStartDate(defaults.startDate);
    setStartTime(defaults.startTime);
    setEndDate(defaults.endDate);
    setEndTime(defaults.endTime);
  }, [open]);

  const handleDiscountTypeChange = (next: PromoDiscountType) => {
    setDiscountType(next);
    setDiscountValue(next === 'fixed' ? '1000' : '10');
  };

  const handleSubmit = () => {
    const trimmedCode = normalizePromoCode(code);
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
          description: description.trim() || null,
          discount_type: discountType,
          discount_value: promoDiscountFromFormValue(discountType, value),
          applies_to: 'upfront',
          program_slug: 'take-control',
          starts_at: istLocalInputToRFC3339(startDate, startTime),
          ends_at: endDate.trim() ? istLocalInputToRFC3339(endDate, endTime || '23:59') : null,
        });
        toast({ message: `Created promo ${result.code}`, variant: 'success' });
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="gap-1 border-b border-slate-100 px-6 py-5 pr-12">
          <DialogTitle className="text-lg font-bold text-slate-900">New promo code</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Create an offer for the first 3 months of Take Control.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            <Field label="Code" hint={PROMO_CODE_CHAR_HINT}>
              <TextInput
                value={code}
                onChange={(value) => setCode(normalizePromoCodeInput(value))}
                placeholder="WELCOME10"
                className={cn('max-w-sm', promoCodeInputProps.className)}
                autoCapitalize={promoCodeInputProps.autoCapitalize}
                autoCorrect={promoCodeInputProps.autoCorrect}
                spellCheck={promoCodeInputProps.spellCheck}
              />
            </Field>

            <Field label="Description" hint="Visible to admins on the promo detail page.">
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Welcome discount for new Take Control members."
                rows={3}
                className="resize-y"
                maxLength={1000}
              />
            </Field>

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
            loadingLabel="Creating…"
            onClick={handleSubmit}
          >
            Create promo code
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
