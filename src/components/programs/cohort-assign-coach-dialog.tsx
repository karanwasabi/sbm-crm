'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { assignCohortCoachAction } from '@/app/(crm)/programs/actions';
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
import type { StaffMember } from '@/utils/api';

type CohortAssignCoachDialogProps = {
  cohortId: string;
  enrollmentIds: string[];
  coaches: StaffMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: () => void;
};

function coachOptionLabel(coach: StaffMember) {
  const name = [coach.first_name, coach.last_name].filter(Boolean).join(' ').trim();
  return name ? `${name} · ${coach.email}` : coach.email;
}

export function CohortAssignCoachDialog({
  cohortId,
  enrollmentIds,
  coaches,
  open,
  onOpenChange,
  onAssigned,
}: CohortAssignCoachDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [coachUserId, setCoachUserId] = useState('');

  useEffect(() => {
    if (!open) return;
    setCoachUserId(coaches[0]?.user_id ?? '');
  }, [open, coaches]);

  const submit = (unassign: boolean) => {
    if (enrollmentIds.length === 0) return;
    if (!unassign && !coachUserId) return;

    startTransition(async () => {
      try {
        const result = await assignCohortCoachAction(cohortId, enrollmentIds, unassign ? null : coachUserId);
        toast({
          message: unassign
            ? `Unassigned coach from ${result.updated} member${result.updated === 1 ? '' : 's'}`
            : `Assigned coach to ${result.updated} member${result.updated === 1 ? '' : 's'}`,
          variant: 'success',
        });
        onOpenChange(false);
        onAssigned?.();
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Could not assign coach.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign coach</DialogTitle>
          <DialogDescription>
            Apply a coach to {enrollmentIds.length} selected member
            {enrollmentIds.length === 1 ? '' : 's'}.
          </DialogDescription>
        </DialogHeader>

        <Field label="Coach">
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-brand"
            value={coachUserId}
            onChange={(event) => setCoachUserId(event.target.value)}
            disabled={pending || coaches.length === 0}
          >
            {coaches.length === 0 ? (
              <option value="">No coaches available</option>
            ) : (
              coaches.map((coach) => (
                <option key={coach.user_id} value={coach.user_id}>
                  {coachOptionLabel(coach)}
                </option>
              ))
            )}
          </select>
        </Field>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="ghost" onClick={() => submit(true)} disabled={pending}>
            Unassign
          </Button>
          <Button
            variant="primary"
            onClick={() => submit(false)}
            loading={pending}
            disabled={coaches.length === 0 || !coachUserId}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
