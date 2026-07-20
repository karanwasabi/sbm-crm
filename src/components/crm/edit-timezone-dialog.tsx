'use client';

import { useEffect, useState, useTransition } from 'react';
import { correctLeadTimezoneAction, getLeadMemberProfileAction } from '@/app/(crm)/customers/actions';
import { LazyTimezonePicker } from '@/components/profile/lazy-profile-fields';
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
import { normalizeProfileTimezoneForDb } from '@/lib/profile-timezone';

type EditTimezoneDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

export function EditTimezoneDialog({ leadId, open, onOpenChange, onDone }: EditTimezoneDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [timezoneId, setTimezoneId] = useState('');
  const [initialTimezoneId, setInitialTimezoneId] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingProfile(true);
    void (async () => {
      const { result } = await getLeadMemberProfileAction(leadId);
      if (cancelled) return;
      const raw = result?.timezoneId?.trim() ?? '';
      const canonical = raw ? (normalizeProfileTimezoneForDb(raw) ?? raw) : '';
      setTimezoneId(canonical);
      setInitialTimezoneId(canonical);
      setLoadingProfile(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, leadId]);

  const canSubmit = Boolean(timezoneId) && timezoneId !== initialTimezoneId && !pending && !loadingProfile;

  const submit = () => {
    if (!canSubmit) return;
    const canonical = normalizeProfileTimezoneForDb(timezoneId) ?? timezoneId;
    startTransition(async () => {
      const { result, error } = await correctLeadTimezoneAction(leadId, canonical);
      if (error || !result) {
        toast({ message: error ?? 'Failed to update timezone.', variant: 'error' });
        return;
      }
      toast({
        message: `Timezone updated to ${result.timezoneId}.`,
        variant: 'success',
      });
      onOpenChange(false);
      onDone?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-visible sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Edit timezone</DialogTitle>
          <DialogDescription>
            Updates the member&apos;s app profile timezone. Habit reminders and day boundaries use this IANA timezone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Timezone">
            <LazyTimezonePicker value={timezoneId} onChange={setTimezoneId} disabled={pending || loadingProfile} />
          </Field>
          {loadingProfile ? <p className="text-xs font-medium text-slate-500">Loading current value…</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={pending} disabled={!canSubmit}>
            Save timezone
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
