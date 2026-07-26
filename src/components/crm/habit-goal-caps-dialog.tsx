'use client';

import { useEffect, useState, useTransition } from 'react';
import { getLeadMemberProfileAction, putLeadHabitGoalCapsAction } from '@/app/(crm)/customers/actions';
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
import type { HabitGoalCaps } from '@/utils/api';

type HabitGoalCapsDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: () => void;
};

type CapFieldKey = keyof HabitGoalCaps;

const FIELDS: {
  key: CapFieldKey;
  label: string;
  min: number;
  max: number;
  integer?: boolean;
  hint?: string;
}[] = [
  { key: 'stepsDailyMin', label: 'Steps min / day', min: 0, max: 20000, integer: true, hint: 'Default min 6000' },
  { key: 'stepsDailyMax', label: 'Steps max / day', min: 0, max: 20000, integer: true, hint: 'Default max 12000' },
  { key: 'exerciseDaysMin', label: 'Exercise min / week', min: 0, max: 9, integer: true, hint: 'Default min 2' },
  { key: 'exerciseDaysMax', label: 'Exercise max / week', min: 0, max: 9, integer: true, hint: 'Default max 6' },
  { key: 'sleepHoursDailyMin', label: 'Sleep min / day (h)', min: 0, max: 24, hint: 'Default min 5.5' },
  { key: 'sleepHoursDailyMax', label: 'Sleep max / day (h)', min: 0, max: 24, hint: 'Default max 8' },
  {
    key: 'nutritionPointsDailyMin',
    label: 'Nutrition min / day',
    min: 0,
    max: 200,
    integer: true,
    hint: 'Default min 40',
  },
  {
    key: 'nutritionPointsDailyMax',
    label: 'Nutrition max / day',
    min: 0,
    max: 200,
    integer: true,
    hint: 'Default max 90',
  },
];

const EMPTY_VALUES: Record<CapFieldKey, string> = {
  stepsDailyMin: '',
  stepsDailyMax: '',
  exerciseDaysMin: '',
  exerciseDaysMax: '',
  sleepHoursDailyMin: '',
  sleepHoursDailyMax: '',
  nutritionPointsDailyMin: '',
  nutritionPointsDailyMax: '',
};

function formatCapValue(n: number | null): string {
  if (n == null) return '';
  return Number.isInteger(n) ? String(n) : String(n);
}

function parseCap(raw: string, min: number, max: number, integer?: boolean): number | null | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number.parseFloat(trimmed);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  if (integer && !Number.isInteger(n)) return undefined;
  return n;
}

export function HabitGoalCapsDialog({ leadId, open, onOpenChange, onDone }: HabitGoalCapsDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [values, setValues] = useState<Record<CapFieldKey, string>>(EMPTY_VALUES);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingProfile(true);
    void (async () => {
      const { result, error } = await getLeadMemberProfileAction(leadId);
      if (cancelled) return;
      if (result) {
        const c = result.habitGoalCaps;
        setValues({
          stepsDailyMin: formatCapValue(c.stepsDailyMin),
          stepsDailyMax: formatCapValue(c.stepsDailyMax),
          exerciseDaysMin: formatCapValue(c.exerciseDaysMin),
          exerciseDaysMax: formatCapValue(c.exerciseDaysMax),
          sleepHoursDailyMin: formatCapValue(c.sleepHoursDailyMin),
          sleepHoursDailyMax: formatCapValue(c.sleepHoursDailyMax),
          nutritionPointsDailyMin: formatCapValue(c.nutritionPointsDailyMin),
          nutritionPointsDailyMax: formatCapValue(c.nutritionPointsDailyMax),
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

  const handleClearAll = () => {
    setValues(EMPTY_VALUES);
  };

  const handleSave = () => {
    const parsed: HabitGoalCaps = {
      stepsDailyMin: null,
      stepsDailyMax: null,
      exerciseDaysMin: null,
      exerciseDaysMax: null,
      sleepHoursDailyMin: null,
      sleepHoursDailyMax: null,
      nutritionPointsDailyMin: null,
      nutritionPointsDailyMax: null,
    };
    for (const { key, label, min, max, integer } of FIELDS) {
      const n = parseCap(values[key], min, max, integer);
      if (n === undefined) {
        toast({
          message: `${label} must be empty or a number between ${min} and ${max}${integer ? ' (whole number)' : ''}.`,
          variant: 'error',
        });
        return;
      }
      parsed[key] = n;
    }

    if (parsed.stepsDailyMin != null && parsed.stepsDailyMax != null && parsed.stepsDailyMin > parsed.stepsDailyMax) {
      toast({ message: 'Steps min cannot exceed max.', variant: 'error' });
      return;
    }
    if (
      parsed.exerciseDaysMin != null &&
      parsed.exerciseDaysMax != null &&
      parsed.exerciseDaysMin > parsed.exerciseDaysMax
    ) {
      toast({ message: 'Exercise min cannot exceed max.', variant: 'error' });
      return;
    }
    if (
      parsed.sleepHoursDailyMin != null &&
      parsed.sleepHoursDailyMax != null &&
      parsed.sleepHoursDailyMin > parsed.sleepHoursDailyMax
    ) {
      toast({ message: 'Sleep min cannot exceed max.', variant: 'error' });
      return;
    }
    if (
      parsed.nutritionPointsDailyMin != null &&
      parsed.nutritionPointsDailyMax != null &&
      parsed.nutritionPointsDailyMin > parsed.nutritionPointsDailyMax
    ) {
      toast({ message: 'Nutrition min cannot exceed max.', variant: 'error' });
      return;
    }

    startTransition(async () => {
      const { result, error } = await putLeadHabitGoalCapsAction(leadId, parsed);
      if (error || !result) {
        toast({ message: error ?? 'Unknown error', variant: 'error' });
        return;
      }
      const g = result.activeWeekGoals;
      toast({
        message: g
          ? `Habit goal caps saved. Active week · ${g.stepsDaily} steps / ${g.exerciseDays} ex / ${g.sleepHoursDaily}h / ${g.nutritionPointsDaily} nutr`
          : `Habit goal caps saved for week ${result.weekStartDate}`,
        variant: 'success',
      });
      onOpenChange(false);
      onDone?.();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle>Habit goal caps</DialogTitle>
          <DialogDescription>
            Optional per-member min/max bounds replace program defaults for weekly progression. Empty = use default.
            Applied from the current week onward. Works with habit modifiers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, hint }) => (
            <Field key={key} label={label} hint={hint}>
              <TextInput
                type="number"
                inputMode="decimal"
                placeholder="Default"
                value={values[key]}
                disabled={loadingProfile || pending}
                onChange={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
              />
            </Field>
          ))}
        </div>
        {loadingProfile ? <p className="text-xs font-medium text-slate-500">Loading current values…</p> : null}
        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={handleClearAll} disabled={pending || loadingProfile}>
            Clear all caps
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={pending || loadingProfile}>
              {pending ? 'Saving…' : 'Save & rebuild'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
