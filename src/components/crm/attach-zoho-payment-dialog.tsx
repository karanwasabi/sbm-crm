'use client';

import { useEffect, useState, useTransition } from 'react';
import { attachLeadZohoPaymentAction, previewLeadZohoPaymentAction } from '@/app/(crm)/customers/actions';
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
import { cn } from '@/lib/cn';
import { formatInrFromPaise } from '@/lib/money';
import { useToast } from '@/components/ui/toast';
import type { PreviewZohoPaymentResult } from '@/utils/api';

const MONTH_OPTIONS = [1, 3, 6, 12] as const;
const PAYMENT_ID_PATTERN = /^pay_[A-Za-z0-9]{8,}$/;

type AttachZohoPaymentDialogProps = {
  leadId: string;
  memberEmail?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttached?: () => void;
};

export function AttachZohoPaymentDialog({
  leadId,
  memberEmail,
  open,
  onOpenChange,
  onAttached,
}: AttachZohoPaymentDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [paymentId, setPaymentId] = useState('');
  const [months, setMonths] = useState<(typeof MONTH_OPTIONS)[number]>(1);
  const [preview, setPreview] = useState<PreviewZohoPaymentResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPaymentId('');
    setMonths(1);
    setPreview(null);
    setPreviewError(null);
    setPreviewing(false);
  }, [open]);

  const trimmed = paymentId.trim();
  const lookupId = PAYMENT_ID_PATTERN.test(trimmed) ? trimmed : '';

  useEffect(() => {
    if (!open || !lookupId) {
      setPreview(null);
      setPreviewError(null);
      setPreviewing(false);
      return;
    }

    let cancelled = false;
    setPreviewing(true);
    setPreview(null);
    setPreviewError(null);

    const timer = window.setTimeout(() => {
      void previewLeadZohoPaymentAction(leadId, lookupId).then(({ result, error }) => {
        if (cancelled) return;
        setPreviewing(false);
        if (error || !result) {
          setPreview(null);
          setPreviewError(error ?? 'Failed to load Razorpay payment.');
          return;
        }
        setPreview(result);
        setPreviewError(result.canAttach ? null : result.blockReason || 'This payment cannot be attached.');
        if (
          result.suggestedMonths === 1 ||
          result.suggestedMonths === 3 ||
          result.suggestedMonths === 6 ||
          result.suggestedMonths === 12
        ) {
          setMonths(result.suggestedMonths);
        }
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [leadId, lookupId, open]);

  const previewMatches = preview?.razorpayPaymentId === lookupId;
  const canSubmit = Boolean(previewMatches && preview?.canAttach && !pending && !previewing);

  const submit = () => {
    if (!canSubmit || !lookupId) return;
    startTransition(async () => {
      const { result, error } = await attachLeadZohoPaymentAction(leadId, lookupId, months);
      if (error || !result) {
        toast({ message: error ?? 'Failed to attach Zoho payment.', variant: 'error' });
        return;
      }
      toast({
        message: `Zoho payment recorded. Access extended by ${result.months} month${result.months === 1 ? '' : 's'}.`,
        variant: 'success',
      });
      onOpenChange(false);
      onAttached?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Record Zoho payment</DialogTitle>
          <DialogDescription>
            {memberEmail
              ? `Attach a captured Razorpay payment from Zoho checkout to ${memberEmail}.`
              : 'Attach a captured Razorpay payment from Zoho checkout to this member.'}{' '}
            This labels the payment as Zoho, extends access, and does not send a confirmation email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Razorpay payment ID" hint="Starts with pay_">
            <TextInput
              value={paymentId}
              onChange={setPaymentId}
              disabled={pending}
              placeholder="pay_…"
              autoComplete="off"
            />
          </Field>

          {lookupId ? (
            <div className="rounded-xl bg-canvas-cool px-3.5 py-3">
              <p className="text-[10px] font-bold tracking-[0.14em] text-slate-400 uppercase">Razorpay amount</p>
              {previewing ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">Looking up payment…</p>
              ) : previewMatches && preview ? (
                <>
                  <p className="mt-1 text-lg font-extrabold text-slate-900 tabular-nums">
                    {formatInrFromPaise(preview.amountPaise)}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-slate-500">
                    Status {preview.status}
                    {preview.email ? ` · ${preview.email}` : ''}
                    {preview.suggestedMonths
                      ? ` · matches ${preview.suggestedMonths}-month plan`
                      : ' · no matching plan amount'}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm font-semibold text-slate-500">Enter a full payment id to load the amount.</p>
              )}
              {previewError ? <p className="mt-2 text-xs font-semibold text-danger-press">{previewError}</p> : null}
            </div>
          ) : null}

          <Field label="Extend access by">
            <div className="flex flex-wrap gap-2">
              {MONTH_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={pending}
                  onClick={() => setMonths(option)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                    months === option ? 'bg-brand text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {option} month{option === 1 ? '' : 's'}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <DialogFooter>
          <Button type="button" variant="light" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!canSubmit} loading={pending}>
            Record payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
