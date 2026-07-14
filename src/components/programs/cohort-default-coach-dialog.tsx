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
import { useToast } from '@/components/ui/toast';
import type { CohortDetail } from '@/types/crm';
import type { StaffMember } from '@/utils/api';

type CohortDefaultCoachDialogProps = {
  cohort: CohortDetail;
  coaches: StaffMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function coachOptionLabel(coach: StaffMember) {
  const name = [coach.first_name, coach.last_name].filter(Boolean).join(' ').trim();
  return name ? `${name} · ${coach.email}` : coach.email;
}

export function CohortDefaultCoachDialog({ cohort, coaches, open, onOpenChange }: CohortDefaultCoachDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [coachUserId, setCoachUserId] = useState('');

  useEffect(() => {
    if (!open) return;
    setCoachUserId(cohort.defaultCoachUserId ?? '');
  }, [open, cohort.defaultCoachUserId]);

  const submit = () => {
    startTransition(async () => {
      try {
        await patchCohortAction(cohort.id, {
          default_coach_user_id: coachUserId === '' ? null : coachUserId,
        });
        toast({ message: 'Default coach updated', variant: 'success' });
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Could not update default coach.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Default coach</DialogTitle>
          <DialogDescription>
            New enrollments in this cohort get this coach automatically. Existing members are unchanged — use bulk
            assign for those.
          </DialogDescription>
        </DialogHeader>

        <Field label="Coach">
          <select
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-brand"
            value={coachUserId}
            onChange={(event) => setCoachUserId(event.target.value)}
            disabled={pending}
          >
            <option value="">No default</option>
            {coaches.map((coach) => (
              <option key={coach.user_id} value={coach.user_id}>
                {coachOptionLabel(coach)}
              </option>
            ))}
          </select>
        </Field>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={pending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
