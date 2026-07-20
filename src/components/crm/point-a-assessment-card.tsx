'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { getLeadPointAAction, putLeadPointAAction } from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import type { PointAAssessment } from '@/utils/api';

type PointAAssessmentCardProps = {
  leadId: string;
  refreshKey?: number;
  onChanged?: () => void;
};

/** Preferred Point A nutrition options — mirrors sbm-app / habits.nutrition.go. */
export const POINT_A_NUTRITION_QUESTIONS: { id: string; label: string; options: string[] }[] = [
  {
    id: 'hunger',
    label: 'Hunger',
    options: ['Never', '1-2 hours', '3-4 hours', 'Hungry most of the time'],
  },
  {
    id: 'protein',
    label: 'Protein',
    options: [
      'Below 0.75 g/kg of bodyweight',
      '0.75-1.25 g/kg of bodyweight',
      '1.25-1.75 g/kg of bodyweight',
      'Above 1.75 g/kg of bodyweight',
      "I don't know",
    ],
  },
  {
    id: 'vegetables',
    label: 'Vegetables',
    options: ['1 serving or less', '1-2 servings', '2-3 servings', 'Above 3 servings'],
  },
  {
    id: 'carbs',
    label: 'Carbs',
    options: ['Most of my plate is carbs', '1/3rd to 1/2 of my plate is carbs', 'Minimal carbs', 'No carbs'],
  },
  {
    id: 'sweets',
    label: 'Sweets',
    options: ['None', 'Minimal', 'A considerable amount'],
  },
  {
    id: 'fats',
    label: 'Fats',
    options: ['None', 'Minimal', 'A considerable amount'],
  },
  {
    id: 'water',
    label: 'Water',
    options: ['Under 1 litre', '1-2 litres', 'Above 2 litres'],
  },
];

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-50 py-1.5 last:border-b-0">
      <span className="shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

function optionsForQuestion(id: string, selected: string | undefined): string[] {
  const base = POINT_A_NUTRITION_QUESTIONS.find((q) => q.id === id)?.options ?? [];
  if (selected && !base.includes(selected)) {
    return [selected, ...base];
  }
  return base;
}

export function PointAAssessmentCard({ leadId, refreshKey = 0, onChanged }: PointAAssessmentCardProps) {
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<PointAAssessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const { result, error: loadError } = await getLeadPointAAction(leadId);
      if (cancelled) return;
      if (loadError || !result) {
        setError(loadError ?? 'Failed to load Point A assessment.');
        setAssessment(null);
      } else {
        setError(null);
        setAssessment(result);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [leadId, refreshKey]);

  const hasAny =
    assessment != null &&
    (assessment.completed ||
      assessment.stepsPerDay != null ||
      assessment.exerciseDaysPerWeek != null ||
      assessment.sleepHours != null ||
      Object.keys(assessment.nutritionAnswers).length > 0);

  return (
    <>
      <Card padding="sm" className="overflow-visible border-slate-100/80 shadow-none">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Point A assessment</p>
          {!loading && !error ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setEditOpen(true)}
            >
              Edit
            </Button>
          ) : null}
        </div>
        {loading ? <p className="text-sm font-medium text-slate-500">Loading…</p> : null}
        {error ? <p className="text-sm font-medium text-danger-press">{error}</p> : null}
        {!loading && !error && !hasAny ? (
          <p className="text-sm font-medium text-slate-500">Not started. Use Edit to complete for the member.</p>
        ) : null}
        {!loading && !error && hasAny && assessment ? (
          <div className="space-y-0.5">
            <Row label="Status" value={assessment.completed ? (assessment.completedAt ?? 'Complete') : 'Incomplete'} />
            <Row label="Steps / day" value={assessment.stepsPerDay != null ? String(assessment.stepsPerDay) : '—'} />
            <Row
              label="Exercise days"
              value={assessment.exerciseDaysPerWeek != null ? String(assessment.exerciseDaysPerWeek) : '—'}
            />
            <Row label="Sleep hours" value={assessment.sleepHours != null ? assessment.sleepHours.toFixed(2) : '—'} />
            <Row
              label="Nutrition score"
              value={assessment.nutritionInitialScore != null ? String(assessment.nutritionInitialScore) : '—'}
            />
            {POINT_A_NUTRITION_QUESTIONS.map((q) => (
              <Row key={q.id} label={q.label} value={assessment.nutritionAnswers[q.id] ?? '—'} />
            ))}
          </div>
        ) : null}
      </Card>
      <PointAEditDialog
        leadId={leadId}
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={assessment}
        onDone={(saved) => {
          setAssessment(saved);
          let message = 'Point A assessment saved.';
          if (saved.goalsRegenerated) {
            message += ' Week goals regenerated.';
          } else if (saved.programWeekOffset != null && saved.programWeekOffset > 0) {
            message += ' Week goals left unchanged (past week 1).';
          }
          if (saved.firstCompleted) {
            message += ' First completion side effects applied.';
          }
          toast({ message, variant: 'success' });
          onChanged?.();
        }}
      />
    </>
  );
}

type PointAEditDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: PointAAssessment | null;
  onDone?: (saved: PointAAssessment) => void;
};

function PointAEditDialog({ leadId, open, onOpenChange, initial, onDone }: PointAEditDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [steps, setSteps] = useState('');
  const [exerciseDays, setExerciseDays] = useState('');
  const [sleepHours, setSleepHours] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setSteps(initial?.stepsPerDay != null ? String(initial.stepsPerDay) : '');
    setExerciseDays(initial?.exerciseDaysPerWeek != null ? String(initial.exerciseDaysPerWeek) : '');
    setSleepHours(initial?.sleepHours != null ? String(initial.sleepHours) : '');
    setAnswers({ ...(initial?.nutritionAnswers ?? {}) });
  }, [open, initial]);

  const parsed = useMemo(() => {
    const stepsN = Number.parseInt(steps.trim(), 10);
    const exerciseN = Number.parseInt(exerciseDays.trim(), 10);
    const sleepN = Number.parseFloat(sleepHours.trim());
    const nutritionComplete = POINT_A_NUTRITION_QUESTIONS.every((q) => Boolean(answers[q.id]?.trim()));
    return {
      stepsN,
      exerciseN,
      sleepN,
      nutritionComplete,
      valid:
        Number.isFinite(stepsN) &&
        stepsN > 0 &&
        Number.isFinite(exerciseN) &&
        exerciseN >= 0 &&
        exerciseN <= 7 &&
        Number.isFinite(sleepN) &&
        sleepN > 0 &&
        nutritionComplete,
    };
  }, [steps, exerciseDays, sleepHours, answers]);

  const submit = () => {
    if (!parsed.valid || pending) return;
    startTransition(async () => {
      const { result, error } = await putLeadPointAAction(leadId, {
        stepsPerDay: parsed.stepsN,
        exerciseDaysPerWeek: parsed.exerciseN,
        sleepHours: parsed.sleepN,
        nutritionAnswers: answers,
      });
      if (error || !result) {
        toast({ message: error ?? 'Failed to save Point A assessment.', variant: 'error' });
        return;
      }
      onOpenChange(false);
      onDone?.(result);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="gap-0 border-b border-slate-100 px-6 py-5 pr-12">
          <DialogTitle className="text-lg font-bold text-slate-900">Edit Point A assessment</DialogTitle>
          <DialogDescription className="mt-1 text-sm text-slate-500">
            Overwrites the stored assessment. Week goals regenerate only in pre-start or programme week 1.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
          <Field label="Steps per day">
            <TextInput value={steps} onChange={setSteps} placeholder="e.g. 6500" disabled={pending} />
          </Field>
          <Field label="Exercise days per week">
            <TextInput value={exerciseDays} onChange={setExerciseDays} placeholder="0–7" disabled={pending} />
          </Field>
          <Field label="Sleep hours">
            <TextInput value={sleepHours} onChange={setSleepHours} placeholder="e.g. 6.5" disabled={pending} />
          </Field>
          {POINT_A_NUTRITION_QUESTIONS.map((q) => {
            const selected = answers[q.id] ?? '';
            const opts = optionsForQuestion(q.id, selected || undefined);
            return (
              <Field key={q.id} label={q.label}>
                <select
                  className="w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-brand"
                  value={selected}
                  disabled={pending}
                  onChange={(event) => setAnswers((prev) => ({ ...prev, [q.id]: event.target.value }))}
                >
                  <option value="">Select…</option>
                  {opts.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>
            );
          })}
        </div>
        <DialogFooter className="mx-0 mb-0 border-t border-slate-100 bg-canvas-cool/60 px-6 py-4 sm:justify-end">
          <Button type="button" variant="light" size="sm" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={pending}
            loadingLabel="Saving…"
            disabled={!parsed.valid || pending}
            onClick={submit}
          >
            Save Point A
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
