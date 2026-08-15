'use client';

import { useEffect, useState, useTransition } from 'react';
import { correctLeadNameAction } from '@/app/(crm)/customers/actions';
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
import { toTitleCase } from '@/lib/title-case';

type CorrectNameDialogProps = {
  leadId: string;
  currentFirstName: string;
  currentLastName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

export function CorrectNameDialog({
  leadId,
  currentFirstName,
  currentLastName,
  open,
  onOpenChange,
  onDone,
}: CorrectNameDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [firstName, setFirstName] = useState(currentFirstName);
  const [lastName, setLastName] = useState(currentLastName);

  useEffect(() => {
    if (!open) return;
    setFirstName(currentFirstName);
    setLastName(currentLastName);
  }, [open, currentFirstName, currentLastName]);

  const nextFirst = firstName.trim();
  const nextLast = lastName.trim();
  const currentFirst = currentFirstName.trim();
  const currentLast = currentLastName.trim();
  const canSubmit = nextFirst.length > 0 && (nextFirst !== currentFirst || nextLast !== currentLast) && !pending;

  const submit = () => {
    if (!canSubmit) return;
    startTransition(async () => {
      const { result, error } = await correctLeadNameAction(leadId, nextFirst, nextLast);
      if (error || !result) {
        toast({ message: error ?? 'Failed to correct name.', variant: 'error' });
        return;
      }
      if (result.unchanged) {
        toast({ message: 'Name is already set to that.', variant: 'success' });
      } else {
        toast({
          message: `Name updated to ${result.toName}. CRM lead and member profile (if linked) now match.`,
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
          <DialogTitle>Correct name</DialogTitle>
          <DialogDescription>
            Updates this CRM lead. If a member account is linked, the app profile name is updated too.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="First name">
              <TextInput
                value={firstName}
                onChange={(value) => setFirstName(toTitleCase(value))}
                disabled={pending}
                autoComplete="off"
              />
            </Field>
            <Field label="Last name">
              <TextInput
                value={lastName}
                onChange={(value) => setLastName(toTitleCase(value))}
                disabled={pending}
                autoComplete="off"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={pending} disabled={!canSubmit}>
              Save name
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
