'use client';

import { useEffect, useState, useTransition } from 'react';
import { correctLeadWeightsAction, getLeadMemberProfileAction } from '@/app/(crm)/customers/actions';
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

type CorrectWeightsDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

function parseKg(raw: string): number | null {
  const n = Number.parseFloat(raw.trim());
  if (!Number.isFinite(n) || n <= 0 || n > 500) return null;
  return n;
}

export function CorrectWeightsDialog({ leadId, open, onOpenChange, onDone }: CorrectWeightsDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [initialKg, setInitialKg] = useState('');
  const [currentKg, setCurrentKg] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingProfile(true);
    void (async () => {
      const { result } = await getLeadMemberProfileAction(leadId);
      if (cancelled) return;
      if (result) {
        setInitialKg(result.initialWeightKg != null ? result.initialWeightKg.toFixed(1) : '');
        setCurrentKg(result.currentWeightKg != null ? result.currentWeightKg.toFixed(1) : '');
      } else {
        setInitialKg('');
        setCurrentKg('');
      }
      setLoadingProfile(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, leadId]);

  const initial = parseKg(initialKg);
  const current = parseKg(currentKg);
  const canSubmit = initial != null && current != null && !pending && !loadingProfile;

  const submit = () => {
    if (!canSubmit || initial == null || current == null) return;
    startTransition(async () => {
      const { result, error } = await correctLeadWeightsAction(leadId, initial, current);
      if (error || !result) {
        toast({ message: error ?? 'Failed to correct weights.', variant: 'error' });
        return;
      }
      const used = result.servings?.weightKgUsed;
      toast({
        message: `Weights updated. Nutrition week ${result.weekStartDate}${used != null ? ` · servings from ${used.toFixed(1)} kg` : ''}.`,
        variant: 'success',
      });
      onOpenChange(false);
      onDone?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle>Correct weights</DialogTitle>
          <DialogDescription>
            Updates journey start (initial) and current weight, then rebuilds this week&apos;s nutrition servings. Set
            both equal when fixing a bad seed weight.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Initial weight (kg) — journey START">
            <TextInput
              type="number"
              inputMode="decimal"
              value={initialKg}
              onChange={setInitialKg}
              disabled={pending || loadingProfile}
              placeholder="e.g. 81.5"
            />
          </Field>
          <Field label="Current weight (kg) — YOU ARE HERE">
            <TextInput
              type="number"
              inputMode="decimal"
              value={currentKg}
              onChange={setCurrentKg}
              disabled={pending || loadingProfile}
              placeholder="e.g. 81.5"
            />
          </Field>
          {loadingProfile ? <p className="text-xs font-medium text-slate-500">Loading current values…</p> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={pending} disabled={!canSubmit}>
            Save &amp; recalculate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
