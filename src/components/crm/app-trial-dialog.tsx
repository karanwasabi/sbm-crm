'use client';

import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react';
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

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

function inclusiveDays(start: string, end: string): number | null {
  const [sy, sm, sd] = start.split('-').map(Number);
  const [ey, em, ed] = end.split('-').map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return null;
  const from = Date.UTC(sy, sm - 1, sd);
  const to = Date.UTC(ey, em - 1, ed);
  return Math.round((to - from) / 86_400_000) + 1;
}

function formatLongDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

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
  const [startsOn, setStartsOn] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [goals, setGoals] = useState<AppTrialGoals>(EMPTY_GOALS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();
  const [submitting, startSubmit] = useTransition();

  useEffect(() => {
    if (!open) return;
    const start = isoDate(new Date());
    setStartsOn(start);
    setEndsOn(addDays(start, DEFAULT_DAYS - 1));
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

  const length = inclusiveDays(startsOn, endsOn);
  const lengthValue = length != null && length >= MIN_DAYS && length <= MAX_DAYS ? String(length) : '';
  const windowError =
    length == null
      ? 'Choose a start and end date.'
      : length < MIN_DAYS || length > MAX_DAYS
        ? 'Trial length must be 5 to 14 days.'
        : null;
  const goalsInvalid = goalError(goals);

  const summary = useMemo(() => {
    if (!startsOn || !endsOn || length == null || length < 1) return null;
    return `${formatLongDate(startsOn)} to ${formatLongDate(endsOn)} · ${length} day${length === 1 ? '' : 's'}`;
  }, [startsOn, endsOn, length]);

  const setGoal = (key: keyof AppTrialGoals, raw: string) => {
    const value = raw.trim() === '' ? 0 : Number(raw);
    setGoals((current) => ({ ...current, [key]: Number.isFinite(value) ? value : 0 }));
    setSubmitError(null);
  };

  const handleSubmit = () => {
    if (windowError || goalsInvalid) {
      setSubmitError(windowError ?? goalsInvalid);
      return;
    }
    startSubmit(async () => {
      const result = await enrollLeadInAppTrialAction(leadId, {
        starts_on: startsOn,
        ends_on: endsOn,
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
            Give <span className="font-semibold text-slate-800">{leadName}</span> a personal trial. Day 1 is the start
            date. The app stays open through the last check-in, then asks them to join the next classroom batch.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(70vh,36rem)] space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Starts" htmlFor="app-trial-start">
              <Input
                id="app-trial-start"
                type="date"
                value={startsOn}
                className="h-11"
                onChange={(event) => {
                  const next = event.target.value;
                  setStartsOn(next);
                  if (lengthValue) setEndsOn(addDays(next, Number(lengthValue) - 1));
                  setSubmitError(null);
                }}
              />
            </Field>
            <Field label="Ends" htmlFor="app-trial-end">
              <Input
                id="app-trial-end"
                type="date"
                value={endsOn}
                min={startsOn || undefined}
                className="h-11"
                onChange={(event) => {
                  setEndsOn(event.target.value);
                  setSubmitError(null);
                }}
              />
            </Field>
          </div>

          <Field label="Length">
            <SearchableSelect
              value={lengthValue}
              searchable={false}
              placeholder="5 to 14 days"
              options={LENGTH_OPTIONS}
              onChange={(value) => {
                if (!startsOn) return;
                setEndsOn(addDays(startsOn, Number(value) - 1));
                setSubmitError(null);
              }}
            />
          </Field>

          {summary ? <p className="text-sm font-medium text-slate-700">{summary}</p> : null}
          {windowError && startsOn && endsOn ? <p className="text-sm text-red-600">{windowError}</p> : null}

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Week 1 goals</p>
              <p className="mt-1 text-sm text-slate-500">
                Filled from their last week, or Point A when there is no week on file. Saved exactly as entered.
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
            disabled={loading || Boolean(loadError) || Boolean(windowError) || Boolean(goalsInvalid) || submitting}
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
