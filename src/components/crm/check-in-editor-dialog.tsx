'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  getLeadCheckInAction,
  getLeadCheckInScheduleAction,
  putLeadCheckInAction,
} from '@/app/(crm)/customers/actions';
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
import {
  buildDailyNutritionMcqQuestions,
  EXERCISE_INTENSITY_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  exerciseIntensityLabel,
  exerciseTypeLabel,
  filterDailyNutritionQuestions,
  formatSleepDuration,
  formatSteps,
  hoursMinutesToSleepHours,
  mergeZeroServingNutritionAnswers,
  nutritionOptionsForQuestion,
  sleepHoursToHoursMinutes,
  snapSleepHours,
  snapSteps,
  type RecommendedNutritionServings,
} from '@/lib/check-in-habits';
import {
  buildCheckInQuestionCopy,
  exerciseDidQuestion,
  sleepQuestion,
  walkingQuestion,
} from '@/lib/check-in-question-copy';
import type { CheckInDay, CheckInSchedule } from '@/utils/api';
import { cn } from '@/lib/cn';

type CheckInEditorDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DraftState = {
  sleepHours: number;
  sleepMinutes: number;
  steps: string;
  exercised: boolean;
  exerciseType: string;
  exerciseIntensity: string;
  nutritionAnswers: Record<string, string>;
};

function dayStatusLabel(status: string): string {
  switch (status) {
    case 'logged':
      return 'Logged';
    case 'missed':
      return 'Missed';
    case 'pending':
      return 'Today';
    default:
      return 'Unavailable';
  }
}

function emptyDraft(): DraftState {
  return {
    sleepHours: 0,
    sleepMinutes: 0,
    steps: '',
    exercised: false,
    exerciseType: 'strength',
    exerciseIntensity: 'moderate',
    nutritionAnswers: {},
  };
}

function draftFromCheckIn(day: CheckInDay): DraftState {
  const sleep = day.sleepHours ?? 0;
  const { hours, minutes } = sleepHoursToHoursMinutes(sleep);
  return {
    sleepHours: hours,
    sleepMinutes: minutes,
    steps: day.steps != null ? String(day.steps) : '',
    exercised: day.exercised ?? false,
    exerciseType: day.exerciseType ?? 'strength',
    exerciseIntensity: day.exerciseIntensity ?? 'moderate',
    nutritionAnswers: { ...(day.nutritionAnswers ?? {}) },
  };
}

function pickInitialDay(schedule: CheckInSchedule): string | null {
  const selectable = schedule.days.filter((d) => d.selectable);
  if (selectable.length === 0) return null;
  const today = selectable.find((d) => d.date === schedule.currentProgramDay);
  if (today) return today.date;
  return selectable[selectable.length - 1]?.date ?? null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-50 py-2 last:border-b-0">
      <span className="shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function CheckInEditorDialog({ leadId, open, onOpenChange }: CheckInEditorDialogProps) {
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<CheckInSchedule | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState<CheckInDay | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DraftState>(emptyDraft);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const servings: RecommendedNutritionServings = useMemo(() => {
    const snap = checkIn?.servingsSnapshot ?? schedule?.recommendedServings;
    return {
      protein: snap?.protein ?? 0,
      fiber: snap?.fiber ?? 0,
      starch: snap?.starch ?? 0,
      dairy: snap?.dairy ?? 0,
      fun: snap?.fun ?? 0,
    };
  }, [checkIn?.servingsSnapshot, schedule?.recommendedServings]);

  const questionCopy = useMemo(() => {
    if (!selectedDate) return null;
    return buildCheckInQuestionCopy({
      programDayYmd: selectedDate,
      timeZone: 'UTC',
      openedAt: new Date(),
      mode: 'namedDay',
    });
  }, [selectedDate]);

  const nutritionQuestions = useMemo(() => {
    if (!questionCopy) return [];
    const all = buildDailyNutritionMcqQuestions(servings, questionCopy);
    return filterDailyNutritionQuestions(all, servings);
  }, [servings, questionCopy]);

  const loadSchedule = useCallback(
    async (offset: number, preferDate?: string | null) => {
      setLoading(true);
      setScheduleError(null);
      const { result, error } = await getLeadCheckInScheduleAction(leadId, offset);
      if (error || !result) {
        setSchedule(null);
        setScheduleError(error ?? 'Failed to load schedule.');
        setLoading(false);
        return;
      }
      setSchedule(result);
      const nextDate =
        preferDate && result.days.some((d) => d.date === preferDate && d.selectable)
          ? preferDate
          : pickInitialDay(result);
      setSelectedDate(nextDate);
      setLoading(false);
    },
    [leadId]
  );

  const loadDay = useCallback(
    async (localDate: string) => {
      setLoading(true);
      const { result, error } = await getLeadCheckInAction(leadId, localDate);
      if (error || !result) {
        toast({ message: error ?? 'Failed to load check-in.', variant: 'error' });
        setCheckIn(null);
        setLoading(false);
        return;
      }
      setCheckIn(result);
      setDraft(draftFromCheckIn(result));
      setEditing(false);
      setLoading(false);
    },
    [leadId, toast]
  );

  useEffect(() => {
    if (!open) return;
    setWeekOffset(0);
    void loadSchedule(0);
  }, [open, loadSchedule]);

  useEffect(() => {
    if (!open || !selectedDate) return;
    void loadDay(selectedDate);
  }, [open, selectedDate, loadDay]);

  const handleWeekChange = (offset: number) => {
    setWeekOffset(offset);
    void loadSchedule(offset, selectedDate);
  };

  const startEdit = () => {
    if (checkIn) setDraft(draftFromCheckIn(checkIn));
    setEditing(true);
  };

  const cancelEdit = () => {
    if (checkIn) setDraft(draftFromCheckIn(checkIn));
    setEditing(false);
  };

  const canSave = useMemo(() => {
    if (!editing || !selectedDate) return false;
    const steps = snapSteps(Number.parseInt(draft.steps.replace(/\D/g, ''), 10) || 0);
    const sleepH = snapSleepHours(draft.sleepHours, draft.sleepMinutes);
    if (sleepH <= 0) return false;
    if (draft.exercised && (!draft.exerciseType || !draft.exerciseIntensity)) return false;
    for (const q of nutritionQuestions) {
      if (!draft.nutritionAnswers[q.id]) return false;
    }
    return steps >= 0;
  }, [draft, editing, nutritionQuestions, selectedDate]);

  const save = () => {
    if (!canSave || !selectedDate) return;
    const steps = snapSteps(Number.parseInt(draft.steps.replace(/\D/g, ''), 10) || 0);
    const sleepHours = snapSleepHours(draft.sleepHours, draft.sleepMinutes);
    startTransition(async () => {
      const { result, error } = await putLeadCheckInAction(leadId, {
        localDate: selectedDate,
        steps,
        sleepHours,
        exercised: draft.exercised,
        exerciseType: draft.exercised ? draft.exerciseType : undefined,
        exerciseIntensity: draft.exercised ? draft.exerciseIntensity : undefined,
        nutritionAnswers: mergeZeroServingNutritionAnswers(draft.nutritionAnswers, servings),
      });
      if (error || !result) {
        toast({ message: error ?? 'Failed to save check-in.', variant: 'error' });
        return;
      }
      toast({
        message: `Check-in saved · ${result.stars} star${result.stars === 1 ? '' : 's'}`,
        variant: 'success',
      });
      setEditing(false);
      await loadSchedule(weekOffset, selectedDate);
      await loadDay(selectedDate);
    });
  };

  const viewNutritionLabel = (questionId: string, answerId: string | undefined): string => {
    if (!answerId) return '—';
    const q = nutritionQuestions.find((item) => item.id === questionId);
    const opt = q ? nutritionOptionsForQuestion(q, answerId).find((o) => o.id === answerId) : undefined;
    return opt?.label ?? answerId;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-lg">
        <DialogHeader className="pr-8">
          <DialogTitle>Check-ins</DialogTitle>
          <DialogDescription>View or edit daily check-in answers for this member.</DialogDescription>
        </DialogHeader>

        {scheduleError ? (
          <p className="text-sm text-red-600">{scheduleError}</p>
        ) : schedule?.awaitingStart ? (
          <p className="text-sm text-slate-600">Program has not started yet — no check-in days available.</p>
        ) : schedule && !schedule.pointAComplete ? (
          <p className="text-sm text-slate-600">Point A assessment must be completed before check-ins are available.</p>
        ) : schedule ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            <Field label="Program week">
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                value={weekOffset}
                disabled={pending || loading}
                onChange={(e) => handleWeekChange(Number.parseInt(e.target.value, 10))}
              >
                {schedule.weeks.map((w) => (
                  <option key={w.offset} value={w.offset}>
                    {w.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Day">
              <div className="flex flex-wrap gap-2">
                {schedule.days.map((d) => (
                  <button
                    key={d.date}
                    type="button"
                    disabled={!d.selectable || pending || loading}
                    onClick={() => setSelectedDate(d.date)}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors',
                      selectedDate === d.date
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                      !d.selectable && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    {d.date.slice(8)}
                    <span className="ml-1 font-normal opacity-80">({dayStatusLabel(d.status)})</span>
                  </button>
                ))}
              </div>
            </Field>

            {loading && !checkIn ? (
              <p className="text-sm text-slate-500">Loading…</p>
            ) : checkIn && !checkIn.exists && !editing ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-medium text-slate-700">Not logged</p>
                <p className="mt-1 text-xs text-slate-500">Click Edit to backfill this day.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {editing ? (
                  <>
                    <Field label={questionCopy ? sleepQuestion(questionCopy) : 'Sleep'}>
                      <div className="flex items-center gap-2">
                        <TextInput
                          type="number"
                          inputMode="numeric"
                          value={String(draft.sleepHours)}
                          onChange={(v) => setDraft((d) => ({ ...d, sleepHours: Number.parseInt(v, 10) || 0 }))}
                          disabled={pending}
                          placeholder="Hours"
                        />
                        <span className="text-sm text-slate-500">h</span>
                        <TextInput
                          type="number"
                          inputMode="numeric"
                          value={String(draft.sleepMinutes)}
                          onChange={(v) => setDraft((d) => ({ ...d, sleepMinutes: Number.parseInt(v, 10) || 0 }))}
                          disabled={pending}
                          placeholder="Min"
                        />
                        <span className="text-sm text-slate-500">m</span>
                      </div>
                    </Field>
                    <Field label={questionCopy ? walkingQuestion(questionCopy) : 'Steps'}>
                      <TextInput
                        type="number"
                        inputMode="numeric"
                        value={draft.steps}
                        onChange={(v) => setDraft((d) => ({ ...d, steps: v }))}
                        onBlur={() =>
                          setDraft((d) => ({
                            ...d,
                            steps: String(snapSteps(Number.parseInt(d.steps.replace(/\D/g, ''), 10) || 0)),
                          }))
                        }
                        disabled={pending}
                        placeholder="e.g. 8000"
                      />
                    </Field>
                    <Field label={questionCopy ? exerciseDidQuestion(questionCopy) : 'Exercise'}>
                      <div className="flex gap-3">
                        {(['yes', 'no'] as const).map((v) => (
                          <label key={v} className="flex cursor-pointer items-center gap-1.5 text-sm">
                            <input
                              type="radio"
                              name="exercised"
                              checked={(v === 'yes') === draft.exercised}
                              onChange={() => setDraft((d) => ({ ...d, exercised: v === 'yes' }))}
                              disabled={pending}
                            />
                            {v === 'yes' ? 'Yes' : 'No'}
                          </label>
                        ))}
                      </div>
                    </Field>
                    {draft.exercised ? (
                      <>
                        <Field label="Exercise type">
                          <select
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={draft.exerciseType}
                            disabled={pending}
                            onChange={(e) => setDraft((d) => ({ ...d, exerciseType: e.target.value }))}
                          >
                            {EXERCISE_TYPE_OPTIONS.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Intensity">
                          <select
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={draft.exerciseIntensity}
                            disabled={pending}
                            onChange={(e) => setDraft((d) => ({ ...d, exerciseIntensity: e.target.value }))}
                          >
                            {EXERCISE_INTENSITY_OPTIONS.map((o) => (
                              <option key={o.id} value={o.id}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </>
                    ) : null}
                    {nutritionQuestions.map((q) => (
                      <Field key={q.id} label={q.question}>
                        <select
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                          value={draft.nutritionAnswers[q.id] ?? ''}
                          disabled={pending}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              nutritionAnswers: { ...d.nutritionAnswers, [q.id]: e.target.value },
                            }))
                          }
                        >
                          <option value="">Select…</option>
                          {nutritionOptionsForQuestion(q, draft.nutritionAnswers[q.id]).map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    ))}
                  </>
                ) : checkIn?.exists ? (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
                    <Row
                      label={questionCopy ? sleepQuestion(questionCopy) : 'Sleep'}
                      value={formatSleepDuration(checkIn.sleepHours ?? 0)}
                    />
                    <Row
                      label={questionCopy ? walkingQuestion(questionCopy) : 'Steps'}
                      value={checkIn.steps != null ? formatSteps(checkIn.steps) : '—'}
                    />
                    <Row
                      label={questionCopy ? exerciseDidQuestion(questionCopy) : 'Exercise'}
                      value={
                        checkIn.exercised
                          ? `${exerciseTypeLabel(checkIn.exerciseType)} · ${exerciseIntensityLabel(checkIn.exerciseIntensity)}`
                          : 'No'
                      }
                    />
                    {nutritionQuestions.map((q) => (
                      <Row
                        key={q.id}
                        label={q.question}
                        value={viewNutritionLabel(q.id, checkIn.nutritionAnswers?.[q.id])}
                      />
                    ))}
                    {checkIn.nutritionScore != null ? (
                      <Row label="Nutrition score" value={String(checkIn.nutritionScore)} />
                    ) : null}
                    {checkIn.stars != null ? <Row label="Stars" value={String(checkIn.stars)} /> : null}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          {!editing ? (
            <Button variant="light" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          ) : null}
          {editing ? (
            <>
              <Button variant="light" onClick={cancelEdit} disabled={pending}>
                Cancel
              </Button>
              <Button onClick={save} disabled={!canSave || pending}>
                Save
              </Button>
            </>
          ) : schedule && schedule.pointAComplete && !schedule.awaitingStart && selectedDate ? (
            <Button onClick={startEdit} disabled={pending || loading}>
              Edit
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
