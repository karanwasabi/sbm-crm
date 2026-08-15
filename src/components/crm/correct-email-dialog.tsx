'use client';

import { useEffect, useState, useTransition } from 'react';
import { correctLeadEmailAction } from '@/app/(crm)/customers/actions';
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

type CorrectEmailDialogProps = {
  leadId: string;
  currentEmail: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

function looksLikeEmail(value: string): boolean {
  const trimmed = value.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0 || at === trimmed.length - 1) return false;
  const domain = trimmed.slice(at + 1);
  return domain.includes('.') && !trimmed.includes(' ');
}

export function CorrectEmailDialog({ leadId, currentEmail, open, onOpenChange, onDone }: CorrectEmailDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState(currentEmail);

  useEffect(() => {
    if (!open) return;
    setEmail(currentEmail);
  }, [open, currentEmail]);

  const nextEmail = email.trim().toLowerCase();
  const current = currentEmail.trim().toLowerCase();
  const invalid = nextEmail.length > 0 && !looksLikeEmail(nextEmail);
  const canSubmit = looksLikeEmail(nextEmail) && nextEmail !== current && !pending;

  const submit = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      const { result, error } = await correctLeadEmailAction(leadId, nextEmail);
      if (error || !result) {
        toast({ message: error ?? 'Failed to correct email.', variant: 'error' });
        return;
      }
      if (result.unchanged) {
        toast({ message: 'Email is already that address.', variant: 'success' });
      } else {
        toast({
          message: `Email updated to ${result.toEmail}. Login uses this address. No email was sent.`,
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
          <DialogTitle>Correct email</DialogTitle>
          <DialogDescription>
            Updates the member login and this CRM lead. Use this for typos like .con instead of .com. Does not send
            mail.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Field label="Current email">
            <TextInput value={currentEmail} disabled />
          </Field>
          <Field label="Correct email">
            <TextInput type="email" value={email} onChange={setEmail} disabled={pending} autoComplete="off" />
          </Field>
          {invalid ? <p className="text-xs font-medium text-red-600">Enter a valid email address.</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={pending} disabled={!canSubmit}>
              Save email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
