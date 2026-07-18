'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { transferEnrollmentAction } from '@/app/(crm)/programs/actions';
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
import { formatCohortStartDate } from '@/lib/cohort-display';
import type { CohortMember, CohortSummary } from '@/types/crm';

type CohortTransferDialogProps = {
  cohortId: string;
  member: CohortMember | null;
  targets: CohortSummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CohortTransferDialog({ cohortId, member, targets, open, onOpenChange }: CohortTransferDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [targetCohortId, setTargetCohortId] = useState('');

  useEffect(() => {
    if (!open) return;
    setTargetCohortId(targets[0]?.id ?? '');
  }, [open, targets]);

  const submit = () => {
    if (!member || !targetCohortId) return;
    startTransition(async () => {
      try {
        await transferEnrollmentAction(cohortId, member.enrollmentId, targetCohortId);
        toast({ message: 'Member transferred', variant: 'success' });
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Transfer failed.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer member</DialogTitle>
          <DialogDescription>
            Move {member?.memberName ?? 'this member'} to another cohort in this program. Between upcoming and locked
            cohorts, the 3-month access window is recalculated from the target start date. Transfers between active
            cohorts leave billing dates unchanged.
          </DialogDescription>
        </DialogHeader>

        <Field label="Target cohort">
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-brand"
            value={targetCohortId}
            onChange={(event) => setTargetCohortId(event.target.value)}
            disabled={pending || targets.length === 0}
          >
            {targets.length === 0 ? (
              <option value="">No eligible cohorts</option>
            ) : (
              targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name} · starts {formatCohortStartDate(target.startsOn)} · {target.phaseLabel}
                </option>
              ))
            )}
          </select>
        </Field>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={pending} disabled={!targetCohortId}>
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
