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
import type { ProgramHistoryItem } from '@/types/crm';

type EditMembershipAccessDialogProps = {
  leadId: string;
  item: ProgramHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function toDateInputValue(isoOrDate: string | null | undefined): string {
  if (!isoOrDate?.trim()) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate)) return isoOrDate;
  const date = new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '';
  // Use UTC calendar day so midnight-UTC access_until does not shift in local TZ.
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addMonthsUTC(startYYYYMMDD: string, months: number): string {
  const [y, m, d] = startYYYYMMDD.split('-').map(Number);
  // Mirror Go AddDate / TrialAccessUntil (day overflow rolls into the next month).
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function EditMembershipAccessDialog({ leadId, item, open, onOpenChange }: EditMembershipAccessDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [accessUntil, setAccessUntil] = useState('');

  const cohortStart = useMemo(() => toDateInputValue(item?.startsOn ?? null), [item?.startsOn]);
  const threeMonthsFromStart = useMemo(() => (cohortStart ? addMonthsUTC(cohortStart, 3) : ''), [cohortStart]);

  useEffect(() => {
    if (!open || !item) return;
    setAccessUntil(toDateInputValue(item.accessUntil) || threeMonthsFromStart || '');
  }, [open, item, threeMonthsFromStart]);

  const submit = () => {
    if (!item || !accessUntil) return;
    startTransition(async () => {
      const { result, error } = await setLeadMembershipAccessUntilAction(leadId, item.id, accessUntil);
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
              ? `Update Active until for ${item.program} · ${item.batch}. Grace until is set to access + 7 days.`
              : 'Update Active until for this enrollment.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {cohortStart ? (
            <p className="text-xs text-slate-500">
              Cohort start: <span className="font-semibold text-slate-700">{cohortStart}</span>
            </p>
          ) : null}
          <Field label="Active until">
            <TextInput type="date" value={accessUntil} onChange={setAccessUntil} disabled={pending} />
          </Field>
          {threeMonthsFromStart ? (
            <Button
              type="button"
              variant="light"
              size="sm"
              leftIcon={<CalendarRange className="h-3.5 w-3.5" />}
              disabled={pending}
              onClick={() => setAccessUntil(threeMonthsFromStart)}
            >
              Set to 3 months from start ({threeMonthsFromStart})
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
