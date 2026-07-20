'use client';

import { useEffect, useState, useTransition } from 'react';
import { getLeadMemberProfileAction, putLeadHabitGoalAddonsAction } from '@/app/(crm)/customers/actions';
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
import type { HabitGoalAddons } from '@/utils/api';

type HabitGoalAddonsDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

const FIELDS: {
  key: keyof HabitGoalAddons;
  label: string;
  min: number;
  max: number;
  integer?: boolean;
}[] = [
  { key: 'stepsDaily', label: 'Steps / day', min: -3000, max: 3000, integer: true },
  { key: 'exerciseDays', label: 'Exercise days', min: -2, max: 2, integer: true },
  { key: 'sleepHoursDaily', label: 'Sleep hours / day', min: -1.5, max: 1.5 },
  { key: 'nutritionPointsDaily', label: 'Nutrition points / day', min: -20, max: 20, integer: true },
];

function parseDelta(raw: string, min: number, max: number, integer?: boolean): number | null {
  const n = Number.parseFloat(raw.trim());
  if (!Number.isFinite(n) || n < min || n > max) return null;
  if (integer && !Number.isInteger(n)) return null;
  return n;
}

function formatDelta(n: number): string {
  return Number.isInteger(n) ? String(n) : String(n);
}

export function HabitGoalAddonsDialog({ leadId, open, onOpenChange, onDone }: HabitGoalAddonsDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [values, setValues] = useState<Record<keyof HabitGoalAddons, string>>({
    stepsDaily: '0',
    exerciseDays: '0',
    sleepHoursDaily: '0',
    nutritionPointsDaily: '0',
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingProfile(true);
    void (async () => {
      const { result, error } = await getLeadMemberProfileAction(leadId);
      if (cancelled) return;
      if (result) {
        setValues({
          stepsDaily: formatDelta(result.habitGoalAddons.stepsDaily),
          exerciseDays: formatDelta(result.habitGoalAddons.exerciseDays),
          sleepHoursDaily: formatDelta(result.habitGoalAddons.sleepHoursDaily),
          nutritionPointsDaily: formatDelta(result.habitGoalAddons.nutritionPointsDaily),
        });
      } else if (error) {
        toast({ message: error, variant: 'error' });
      }
      setLoadingProfile(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId, open, toast]);

  const handleSave = () => {
    const parsed: HabitGoalAddons = {
      stepsDaily: 0,
      exerciseDays: 0,
      sleepHoursDaily: 0,
      nutritionPointsDaily: 0,
    };
    for (const { key, label, min, max, integer } of FIELDS) {
      const n = parseDelta(values[key], min, max, integer);
      if (n == null) {
        toast({
          message: `${label} must be a number between ${min} and ${max}${integer ? ' (whole number)' : ''}.`,
          variant: 'error',
        });
        return;
      }
      parsed[key] = n;
    }

    startTransition(async () => {
      const { result, error } = await putLeadHabitGoalAddonsAction(leadId, parsed);
      if (error || !result) {
        toast({ message: error ?? 'Unknown error', variant: 'error' });
        return;
      }
      const g = result.goals;
      toast({
        message: g
          ? `Habit goal modifiers saved. Active week · ${g.stepsDaily} steps / ${g.exerciseDays} ex / ${g.sleepHoursDaily}h / ${g.nutritionPointsDaily} nutr`
          : `Habit goal modifiers saved for week ${result.weekStartDate}`,
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
          <DialogTitle>Habit goal modifiers</DialogTitle>
          <DialogDescription>
            Permanent deltas on top of algorithm goals (may exceed Min/Max clamps). Applied from the current week
            onward. Week 1 nutrition stays 0.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label }) => (
            <Field key={key} label={label}>
              <TextInput
                type="number"
                inputMode="decimal"
                value={values[key]}
                disabled={loadingProfile || pending}
                onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
              />
            </Field>
          ))}
        </div>
        {loadingProfile ? <p className="text-xs font-medium text-slate-500">Loading current values…</p> : null}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={pending || loadingProfile}>
            {pending ? 'Saving…' : 'Save & rebuild'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
