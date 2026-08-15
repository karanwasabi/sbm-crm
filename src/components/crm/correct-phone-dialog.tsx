'use client';

import { useEffect, useState, useTransition } from 'react';
import { correctLeadPhoneAction } from '@/app/(crm)/customers/actions';
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

type CorrectPhoneDialogProps = {
  leadId: string;
  currentPhone: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

export function CorrectPhoneDialog({ leadId, currentPhone, open, onOpenChange, onDone }: CorrectPhoneDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [phone, setPhone] = useState(currentPhone);

  useEffect(() => {
    if (!open) return;
    setPhone(currentPhone);
  }, [open, currentPhone]);

  const nextPhone = phone.trim();
  const current = currentPhone.trim();
  const invalid = nextPhone.length > 0 && !looksLikePhone(nextPhone);
  const canSubmit = looksLikePhone(nextPhone) && nextPhone !== current && !pending;

  const submit = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      const { result, error } = await correctLeadPhoneAction(leadId, nextPhone);
      if (error || !result) {
        toast({ message: error ?? 'Failed to correct phone.', variant: 'error' });
        return;
      }
      if (result.unchanged) {
        toast({ message: 'Phone is already that number.', variant: 'success' });
      } else {
        toast({
          message: `Phone updated to ${result.toPhone}. CRM lead and member WhatsApp (if linked) now match.`,
          variant: 'success',
        });
      }
      onOpenChange(false);
      onDone?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Correct phone / WhatsApp</DialogTitle>
          <DialogDescription>
            Updates this CRM lead phone. If a member account is linked, WhatsApp on the app profile is updated too.
            Include the country code, for example +91.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field label="Current phone">
            <TextInput value={currentPhone || '—'} onChange={() => undefined} disabled />
          </Field>
          <Field label="Correct phone">
            <TextInput
              type="tel"
              value={phone}
              onChange={setPhone}
              disabled={pending}
              autoComplete="off"
              placeholder="+9198XXXXXXXX"
            />
          </Field>
          {invalid ? <p className="text-xs font-medium text-red-600">Enter a valid number with country code.</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={pending} disabled={!canSubmit}>
              Save phone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
