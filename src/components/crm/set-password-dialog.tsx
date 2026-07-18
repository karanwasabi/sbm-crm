'use client';

import { useEffect, useState, useTransition } from 'react';
import { setLeadPasswordAction } from '@/app/(crm)/customers/actions';
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

const MIN_PASSWORD_LENGTH = 6;

type SetPasswordDialogProps = {
  leadId: string;
  memberEmail?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SetPasswordDialog({ leadId, memberEmail, open, onOpenChange }: SetPasswordDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirm('');
  }, [open]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit = password.length >= MIN_PASSWORD_LENGTH && password === confirm && !pending;

  const submit = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      const { error } = await setLeadPasswordAction(leadId, password);
      if (error) {
        toast({ message: error, variant: 'error' });
        return;
      }
      toast({ message: 'Password updated. No email was sent.', variant: 'success' });
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Set password</DialogTitle>
          <DialogDescription>
            {memberEmail
              ? `Set a login password for ${memberEmail}. This does not send an email.`
              : 'Set a login password for this member. This does not send an email.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="New password">
            <TextInput
              type="password"
              value={password}
              onChange={setPassword}
              disabled={pending}
              autoComplete="new-password"
            />
          </Field>
          <Field label="Confirm password">
            <TextInput
              type="password"
              value={confirm}
              onChange={setConfirm}
              disabled={pending}
              autoComplete="new-password"
            />
          </Field>
          {tooShort ? (
            <p className="text-xs font-medium text-red-600">Password must be at least 6 characters.</p>
          ) : null}
          {mismatch ? <p className="text-xs font-medium text-red-600">Passwords do not match.</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={pending} disabled={!canSubmit}>
            Set password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
