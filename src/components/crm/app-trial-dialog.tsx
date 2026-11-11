'use client';

import { Sparkles } from 'lucide-react';
import { useEffect, useState, useTransition, type ReactNode } from 'react';
import { enrollLeadInAppTrialAction, getLeadAppTrialGoalsAction } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { AppTrialGoals } from '@/utils/api';

const MIN_DAYS = 5;
const MAX_DAYS = 14;
const DEFAULT_DAYS = 7;

const LENGTH_OPTIONS = Array.from({ length: MAX_DAYS - MIN_DAYS + 1 }, (_, index) => {
  const days = MIN_DAYS + index;
  return {
    value: String(days),
    label: days === DEFAULT_DAYS ? `${days} days · default` : `${days} days`,
    triggerLabel: `${days} days`,
  };
});

const EMPTY_GOALS: AppTrialGoals = {
  steps_daily: 0,
  exercise_days: 0,
  sleep_hours_daily: 0,
  nutrition_points_daily: 0,
  protein: 0,
  fiber: 0,
  starch: 0,
  dairy: 0,
  fun: 0,
};

type AppTrialDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  onEnrolled: () => void;
};

function goalError(goals: AppTrialGoals): string | null {
  if (goals.steps_daily < 1000 || goals.steps_daily > 20000) return 'Steps must be between 1,000 and 20,000.';
  if (goals.exercise_days < 0 || goals.exercise_days > 7) return 'Exercise days must be between 0 and 7.';
  if (goals.sleep_hours_daily < 4 || goals.sleep_hours_daily > 12) return 'Sleep must be between 4 and 12 hours.';
  if (goals.nutrition_points_daily < 0 || goals.nutrition_points_daily > 200) {
    return 'Nutrition points must be between 0 and 200.';
  }
  const servings = [goals.protein, goals.fiber, goals.starch, goals.dairy, goals.fun];
  if (servings.some((value) => value < 0 || value > 20)) return 'Each serving target must be between 0 and 20.';
  return null;
}

export function AppTrialDialog({ open, onOpenChange, leadId, leadName, onEnrolled }: AppTrialDialogProps) {
  const [durationDays, setDurationDays] = useState(String(DEFAULT_DAYS));
  const [goals, setGoals] = useState<AppTrialGoals>(EMPTY_GOALS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (!open) return;
    setDurationDays(String(DEFAULT_DAYS));
    setGoals(EMPTY_GOALS);
    setLoadError(null);
    setSubmitError(null);
    startLoad(async () => {
      const result = await getLeadAppTrialGoalsAction(leadId);
      if (result.error || !result.goals) {
        setLoadError(result.error ?? 'Failed to load trial goals.');
        return;
      }
      setGoals(result.goals);
      setLoadError(null);
    });
  }, [open, leadId]);

  const length = Number(durationDays);
  const lengthError =
    !Number.isFinite(length) || length < MIN_DAYS || length > MAX_DAYS ? 'Trial length must be 5 to 14 days.' : null;
  const goalsInvalid = goalError(goals);

  const setGoal = (key: keyof AppTrialGoals, raw: string) => {
    const value = raw.trim() === '' ? 0 : Number(raw);
    setGoals((current) => ({ ...current, [key]: Number.isFinite(value) ? value : 0 }));
    setSubmitError(null);
  };

  const handleSubmit = () => {
    if (lengthError || goalsInvalid) {
      setSubmitError(lengthError ?? goalsInvalid);
      return;
    }
    startSubmit(async () => {
      const result = await enrollLeadInAppTrialAction(leadId, {
        duration_days: length,
        goals: {
          ...goals,
          steps_daily: Math.round(goals.steps_daily),
          exercise_days: Math.round(goals.exercise_days),
          nutrition_points_daily: Math.round(goals.nutrition_points_daily),
        },
      });
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      onOpenChange(false);
      onEnrolled();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-brand" aria-hidden />
            Add to Take Control Trial
          </DialogTitle>
          <DialogDescription className="text-left text-sm text-slate-600">
            Give <span className="font-semibold text-slate-800">{leadName}</span> a personal trial. They will see a
            welcome screen and Day 1 starts when they tap Start trial in the app.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(70vh,36rem)] space-y-5 overflow-y-auto px-6 py-5">
          <Field label="Length">
            <SearchableSelect
              value={durationDays}
              searchable={false}
              placeholder="5 to 14 days"
              options={LENGTH_OPTIONS}
              onChange={(value) => {
                setDurationDays(value);
                setSubmitError(null);
              }}
            />
          </Field>

          <p className="text-sm font-medium text-slate-700">
            {length} day{length === 1 ? '' : 's'} · starts when they tap Start trial
          </p>
          {lengthError ? <p className="text-sm text-red-600">{lengthError}</p> : null}

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Week 1 goals</p>
              <p className="mt-1 text-sm text-slate-500">
                Filled from their last week, or Point A when there is no week on file. Applied when they start the
                trial.
              </p>
            </div>
            {loading ? (
              <p className="text-sm text-slate-500">Loading their last goals…</p>
            ) : loadError ? (
              <p className="text-sm text-red-600">{loadError}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField
                  id="app-trial-steps"
                  label="Steps / day"
                  value={goals.steps_daily}
                  min={1000}
                  max={20000}
                  step={100}
                  onChange={(value) => setGoal('steps_daily', value)}
                />
                <NumberField
                  id="app-trial-exercise"
                  label="Exercise days"
                  value={goals.exercise_days}
                  min={0}
                  max={7}
                  step={1}
                  onChange={(value) => setGoal('exercise_days', value)}
                />
                <NumberField
                  id="app-trial-sleep"
                  label="Sleep hours"
                  value={goals.sleep_hours_daily}
                  min={4}
                  max={12}
                  step={0.5}
                  onChange={(value) => setGoal('sleep_hours_daily', value)}
                />
                <NumberField
                  id="app-trial-nutrition"
                  label="Nutrition points"
                  value={goals.nutrition_points_daily}
                  min={0}
                  max={200}
                  step={1}
                  onChange={(value) => setGoal('nutrition_points_daily', value)}
                />
                <NumberField
                  id="app-trial-protein"
                  label="Protein servings"
                  value={goals.protein}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(value) => setGoal('protein', value)}
                />
                <NumberField
                  id="app-trial-fiber"
                  label="Fiber servings"
                  value={goals.fiber}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(value) => setGoal('fiber', value)}
                />
                <NumberField
                  id="app-trial-starch"
                  label="Starch servings"
                  value={goals.starch}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(value) => setGoal('starch', value)}
                />
                <NumberField
                  id="app-trial-dairy"
                  label="Dairy servings"
                  value={goals.dairy}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(value) => setGoal('dairy', value)}
                />
                <NumberField
                  id="app-trial-fun"
                  label="Fun servings"
                  value={goals.fun}
                  min={0}
                  max={20}
                  step={0.5}
                  onChange={(value) => setGoal('fun', value)}
                />
              </div>
            )}
          </div>

          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
        </div>

        <DialogFooter className="mx-0 mb-0 gap-2 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
          <Button
            type="button"
            variant="light"
            size="sm"
            className="min-w-[5.5rem]"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="min-w-[8.75rem]"
            loading={submitting}
            loadingLabel="Adding…"
            disabled={loading || Boolean(loadError) || Boolean(lengthError) || Boolean(goalsInvalid) || submitting}
            onClick={handleSubmit}
          >
            Add to trial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        className="h-11 tabular-nums"
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
