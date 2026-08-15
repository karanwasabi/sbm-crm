'use client';

import { useEffect, useState, useTransition } from 'react';
import { correctLeadPhoneAction } from '@/app/(crm)/customers/actions';
import { LazyPhoneInput } from '@/components/profile/lazy-profile-fields';
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
import { useToast } from '@/components/ui/toast';
import type { Country } from '@/types/reference';

type CorrectPhoneDialogProps = {
  leadId: string;
  currentPhone: string;
  suggestedCountryIso?: string;
  countries: Country[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

function isE164(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(value.trim());
}

export function CorrectPhoneDialog({
  leadId,
  currentPhone,
  suggestedCountryIso,
  countries,
  open,
  onOpenChange,
  onDone,
}: CorrectPhoneDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [phone, setPhone] = useState(currentPhone);
  const [syncToken, setSyncToken] = useState(0);

  useEffect(() => {
    if (!open) return;
    setPhone(currentPhone);
    setSyncToken((token) => token + 1);
  }, [open, currentPhone]);

  const nextPhone = phone.trim();
  const canSubmit = isE164(nextPhone) && countries.length > 0 && !pending;

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
          message: `Phone updated to ${result.toPhone}. CRM, member WhatsApp, and WhatsApp chat mapping now match.`,
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
            Convonite chat mapping and opt-out state follow the new number.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field label="Phone / WhatsApp">
            <LazyPhoneInput
              value={phone}
              onChange={setPhone}
              countries={countries}
              suggestedCountryIso={suggestedCountryIso || 'IN'}
              syncToken={syncToken}
              disabled={pending}
            />
          </Field>
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
