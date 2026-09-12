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
  cohortStartDateOnly,
  exclusiveBoundaryDateOnly,
  inclusiveAccessEndDateOnly,
  inclusiveMonthsFromCohortStart,
} from '@/lib/access-until-display';
import type { ProgramHistoryItem } from '@/types/crm';

type EditMembershipAccessDialogProps = {
  leadId: string;
  item: ProgramHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PRESET_MONTHS = [1, 3] as const;

export function EditMembershipAccessDialog({ leadId, item, open, onOpenChange }: EditMembershipAccessDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [accessUntil, setAccessUntil] = useState('');

  const cohortStart = useMemo(() => cohortStartDateOnly(item?.startsOn ?? null), [item?.startsOn]);
  const inclusivePresets = useMemo(() => {
    if (!cohortStart) return [] as { months: number; inclusive: string }[];
    return PRESET_MONTHS.map((months) => ({
      months,
      inclusive: inclusiveMonthsFromCohortStart(cohortStart, months),
    })).filter((p) => Boolean(p.inclusive));
  }, [cohortStart]);
  const inclusiveOneMonthFromStart = inclusivePresets.find((p) => p.months === 1)?.inclusive ?? '';

  useEffect(() => {
    if (!open || !item) return;
    // Default to current inclusive end, else 1-month trial window (same as trial_1m).
    setAccessUntil(inclusiveAccessEndDateOnly(item.accessUntil) || inclusiveOneMonthFromStart || '');
  }, [open, item, inclusiveOneMonthFromStart]);

  const submit = () => {
    if (!item || !accessUntil) return;
    // Date picker is inclusive last day; API stores exclusive midnight UTC (+1 day).
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
          {inclusivePresets.length > 0 ? (
            <div className="flex flex-col gap-2">
              {inclusivePresets.map(({ months, inclusive }) => (
                <Button
                  key={months}
                  type="button"
                  variant="light"
                  size="sm"
                  leftIcon={<CalendarRange className="h-3.5 w-3.5" />}
                  disabled={pending}
                  onClick={() => setAccessUntil(inclusive)}
                >
                  Set to {months} month{months === 1 ? '' : 's'} from start ({inclusive})
                </Button>
              ))}
            </div>
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
