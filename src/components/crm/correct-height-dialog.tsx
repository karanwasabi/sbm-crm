'use client';

import { useEffect, useState, useTransition } from 'react';
import { correctLeadHeightAction, getLeadMemberProfileAction } from '@/app/(crm)/customers/actions';
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

type CorrectHeightDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

function parseCm(raw: string): number | null {
  const n = Number.parseFloat(raw.trim());
  if (!Number.isFinite(n) || n <= 0 || n > 300) return null;
  return n;
}

function computeBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (weightKg == null || heightCm == null || !(weightKg > 0) || !(heightCm > 0)) return null;
  const heightM = heightCm / 100;
  return +(weightKg / (heightM * heightM)).toFixed(1);
}

export function CorrectHeightDialog({ leadId, open, onOpenChange, onDone }: CorrectHeightDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [heightCm, setHeightCm] = useState('');
  const [currentWeightKg, setCurrentWeightKg] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingProfile(true);
    void (async () => {
      const { result } = await getLeadMemberProfileAction(leadId);
      if (cancelled) return;
      if (result) {
        setHeightCm(result.heightCm != null ? result.heightCm.toFixed(1) : '');
        setCurrentWeightKg(result.currentWeightKg ?? result.initialWeightKg);
      } else {
        setHeightCm('');
        setCurrentWeightKg(null);
      }
      setLoadingProfile(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, leadId]);

  const height = parseCm(heightCm);
  const previewBmi = computeBmi(currentWeightKg, height);
  const canSubmit = height != null && !pending && !loadingProfile;

  const submit = () => {
    if (!canSubmit || height == null) return;
    startTransition(async () => {
      const { result, error } = await correctLeadHeightAction(leadId, height);
      if (error || !result) {
        toast({ message: error ?? 'Failed to correct height.', variant: 'error' });
        return;
      }
      toast({
        message:
          result.bmi != null
            ? `Height updated to ${result.heightCm.toFixed(1)} cm · BMI ${result.bmi.toFixed(1)}.`
            : `Height updated to ${result.heightCm.toFixed(1)} cm.`,
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
          <DialogTitle>Correct height</DialogTitle>
          <DialogDescription>
            Updates the member&apos;s profile height. BMI and journey milestones recalculate from the new height on the
            next app load. Nutrition servings are based on weight only and are unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Height (cm)">
            <TextInput
              type="number"
              inputMode="decimal"
              value={heightCm}
              onChange={setHeightCm}
              disabled={pending || loadingProfile}
              placeholder="e.g. 165.0"
            />
          </Field>
          {loadingProfile ? <p className="text-xs font-medium text-slate-500">Loading current value…</p> : null}
          {!loadingProfile && previewBmi != null ? (
            <p className="text-xs font-medium text-slate-500">
              Preview BMI with current weight
              {currentWeightKg != null ? ` (${currentWeightKg.toFixed(1)} kg)` : ''}:{' '}
              <span className="font-semibold text-slate-700">{previewBmi.toFixed(1)}</span>
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={pending} disabled={!canSubmit}>
            Save height
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
