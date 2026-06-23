'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { patchCohortAction } from '@/app/(crm)/programs/actions';
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
import type { CohortDetail } from '@/types/crm';

type CohortEditDialogProps = {
  cohort: CohortDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CohortEditDialog({ cohort, open, onOpenChange }: CohortEditDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(cohort.name);
  const [startsOn, setStartsOn] = useState(cohort.startsOn);
  const [confirmDateChange, setConfirmDateChange] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(cohort.name);
    setStartsOn(cohort.startsOn);
    setConfirmDateChange(false);
  }, [cohort.name, cohort.startsOn, open]);

  const dateChanged = startsOn !== cohort.startsOn;
  const needsDateConfirm = cohort.status === 'upcoming' && dateChanged;

  const submit = () => {
    if (needsDateConfirm && !confirmDateChange) {
      setConfirmDateChange(true);
      return;
    }

    startTransition(async () => {
      try {
        const input: { name?: string; starts_on?: string } = {};
        if (name.trim() !== cohort.name) input.name = name.trim();
        if (dateChanged && cohort.canEditStartsOn) input.starts_on = startsOn;
        if (!input.name && !input.starts_on) {
          onOpenChange(false);
          return;
        }
        await patchCohortAction(cohort.id, input);
        toast({ message: 'Cohort updated', variant: 'success' });
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Could not update cohort.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit cohort</DialogTitle>
          <DialogDescription>
            {cohort.status === 'queued'
              ? 'Queued cohorts can be renamed and rescheduled freely.'
              : cohort.canEditStartsOn
                ? 'You can edit the name and start date while no members are subscribed.'
                : 'Start date is locked because members are already subscribed. Razorpay billing dates stay tied to this cohort.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Cohort name">
            <TextInput value={name} onChange={setName} disabled={pending} />
          </Field>
          <Field label="Start date">
            <TextInput
              type="date"
              value={startsOn}
              onChange={setStartsOn}
              disabled={pending || !cohort.canEditStartsOn}
            />
          </Field>
          {needsDateConfirm && confirmDateChange && (
            <p className="rounded-xl bg-[#FEF3C7] px-3 py-2 text-[13px] text-[#92400E]">
              Changing the upcoming start date affects when checkout enrollments begin. Existing Razorpay subscriptions
              are not moved automatically — confirm only if no paid members are enrolled yet.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={pending}>
            {needsDateConfirm && !confirmDateChange ? 'Review change' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
