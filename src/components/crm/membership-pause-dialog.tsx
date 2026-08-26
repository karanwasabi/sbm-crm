'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { PauseCircle } from 'lucide-react';
import { scheduleMembershipPauseAction } from '@/app/(crm)/customers/actions';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { formatInclusiveAccessEndDate, inclusiveAccessEndDateOnly } from '@/lib/access-until-display';
import { autoRenewInfo } from '@/lib/program-history-auto-renew';
import type { ProgramHistoryItem } from '@/types/crm';

type MembershipPauseDialogProps = {
  leadId: string;
  item: ProgramHistoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function inclusivePauseDays(start: string, end: string): number {
  if (!start || !end) return 0;
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    return 0;
  }
  return Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
}

function formatPauseDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function todayUtcDateOnly(): string {
  const now = new Date();
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(now);
}

export function MembershipPauseDialog({ leadId, item, open, onOpenChange }: MembershipPauseDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [pauseStartsOn, setPauseStartsOn] = useState('');
  const [pauseEndsOn, setPauseEndsOn] = useState('');
  const [reason, setReason] = useState('');

  const autoRenew = useMemo(() => (item ? autoRenewInfo(item) : null), [item]);
  const autoRenewBlocking = Boolean(item?.autoRenewEnabled && autoRenew?.label === 'On');

  useEffect(() => {
    if (!open || !item) return;
    setPauseStartsOn(todayUtcDateOnly());
    setPauseEndsOn('');
    setReason('');
  }, [open, item]);

  const pauseDays = useMemo(() => inclusivePauseDays(pauseStartsOn, pauseEndsOn), [pauseStartsOn, pauseEndsOn]);

  const accessUntilLabel = item?.accessUntil ? formatInclusiveAccessEndDate(item.accessUntil) : null;

  const previewMessage = useMemo(() => {
    if (!item || !pauseStartsOn || !pauseEndsOn || pauseDays <= 0) {
      return null;
    }
    const startLabel = formatPauseDate(pauseStartsOn);
    const endLabel = formatPauseDate(pauseEndsOn);
    const dayWord = pauseDays === 1 ? 'day' : 'days';
    return `Membership will be paused from ${startLabel} through ${endLabel} (${pauseDays} ${dayWord}). Access and grace will extend by ${pauseDays} ${dayWord}. The member cannot log in during the pause window.`;
  }, [item, pauseDays, pauseEndsOn, pauseStartsOn]);

  const submit = () => {
    if (!item) return;
    if (autoRenewBlocking) {
      toast({
        message: 'Turn off auto-renew before scheduling a pause.',
        variant: 'error',
      });
      return;
    }
    const trimmedReason = reason.trim();
    if (!pauseStartsOn || !pauseEndsOn) {
      toast({ message: 'Enter pause start and end dates.', variant: 'error' });
      return;
    }
    if (pauseDays <= 0) {
      toast({ message: 'Pause end must be on or after pause start.', variant: 'error' });
      return;
    }
    if (!trimmedReason) {
      toast({ message: 'Reason is required.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      const { result, error } = await scheduleMembershipPauseAction(leadId, {
        enrollmentId: item.id,
        pauseStartsOn,
        pauseEndsOn,
        reason: trimmedReason,
      });
      if (error || !result) {
        toast({ message: error ?? 'Failed to schedule pause.', variant: 'error' });
        return;
      }
      toast({
        message: `Pause scheduled through ${formatPauseDate(result.pauseEndsOn)}.`,
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
          <DialogTitle>Schedule membership pause</DialogTitle>
          <DialogDescription>
            {item
              ? `Pause app access for ${item.program} · ${item.batch}. Dates are UTC calendar days.`
              : 'Schedule a membership pause for this enrollment.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {accessUntilLabel ? (
            <p className="text-xs text-slate-500">
              Paid access until <span className="font-semibold text-slate-700">{accessUntilLabel}</span>
              {inclusiveAccessEndDateOnly(item?.accessUntil) ? (
                <span className="text-slate-400"> (last day)</span>
              ) : null}
            </p>
          ) : null}

          {autoRenewBlocking ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm font-semibold text-rose-800">
              Auto-renew is still on. Turn off auto-renew before scheduling a pause.
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Pause starts" hint="UTC calendar day">
              <TextInput type="date" value={pauseStartsOn} onChange={setPauseStartsOn} disabled={pending} />
            </Field>
            <Field label="Pause ends" hint="Inclusive last paused day">
              <TextInput type="date" value={pauseEndsOn} onChange={setPauseEndsOn} disabled={pending} />
            </Field>
          </div>

          <Field label="Reason" hint="Required — shown in CRM and timeline">
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={pending}
              rows={3}
              placeholder="e.g. travel, medical, family emergency"
            />
          </Field>

          {previewMessage ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3">
              <div className="flex items-start gap-2">
                <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" aria-hidden />
                <p className="text-sm leading-relaxed text-sky-900">{previewMessage}</p>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            loading={pending}
            disabled={!item || !pauseStartsOn || !pauseEndsOn || pauseDays <= 0 || !reason.trim() || autoRenewBlocking}
          >
            Schedule pause
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
