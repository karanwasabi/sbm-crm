'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarRange } from 'lucide-react';
import { setLeadMembershipAccessUntilAction } from '@/app/(crm)/customers/actions';
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
import {
  addMonthsUTC,
  cohortStartDateOnly,
  exclusiveBoundaryDateOnly,
  inclusiveAccessEndDateOnly,
  shiftUtcDateOnly,
} from '@/lib/access-until-display';
import type { ProgramHistoryItem } from '@/types/crm';

type EditMembershipAccessDialogProps = {
  leadId: string;
  item: ProgramHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditMembershipAccessDialog({ leadId, item, open, onOpenChange }: EditMembershipAccessDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [accessUntil, setAccessUntil] = useState('');

  const cohortStart = useMemo(() => cohortStartDateOnly(item?.startsOn ?? null), [item?.startsOn]);
  const inclusiveThreeMonthsFromStart = useMemo(
    () => (cohortStart ? shiftUtcDateOnly(addMonthsUTC(cohortStart, 3), -1) : ''),
    [cohortStart]
  );

  useEffect(() => {
    if (!open || !item) return;
    setAccessUntil(inclusiveAccessEndDateOnly(item.accessUntil) || inclusiveThreeMonthsFromStart || '');
  }, [open, item, inclusiveThreeMonthsFromStart]);

  const submit = () => {
    if (!item || !accessUntil) return;
    const apiDate = exclusiveBoundaryDateOnly(accessUntil);
    if (!apiDate) {
      toast({ message: 'Enter a valid access end date.', variant: 'error' });
      return;
    }
    startTransition(async () => {
      const { result, error } = await setLeadMembershipAccessUntilAction(leadId, item.id, apiDate);
      if (error || !result) {
        toast({ message: error ?? 'Failed to update membership access.', variant: 'error' });
        return;
      }
      toast({
        message: `Access until updated to ${accessUntil}. Grace follows (+7 days).`,
        variant: 'success',
      });
      onOpenChange(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Edit membership access</DialogTitle>
          <DialogDescription>
            {item
              ? `Update Active until for ${item.program} · ${item.batch}. Last day of access (UTC). Grace until is access + 7 days.`
              : 'Update Active until for this enrollment.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {cohortStart ? (
            <p className="text-xs text-slate-500">
              Cohort start: <span className="font-semibold text-slate-700">{cohortStart}</span>
            </p>
          ) : null}
          <Field label="Active until" hint="Last day of access (UTC calendar day)">
            <TextInput type="date" value={accessUntil} onChange={setAccessUntil} disabled={pending} />
          </Field>
          {inclusiveThreeMonthsFromStart ? (
            <Button
              type="button"
              variant="light"
              size="sm"
              leftIcon={<CalendarRange className="h-3.5 w-3.5" />}
              disabled={pending}
              onClick={() => setAccessUntil(inclusiveThreeMonthsFromStart)}
            >
              Set to 3 months from start ({inclusiveThreeMonthsFromStart})
            </Button>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={pending} disabled={!item || !accessUntil}>
            Save access until
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
