'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  deleteLeadSprintDayAction,
  getLeadSprintAction,
  getLeadSprintDayAction,
  putLeadSprintDayAction,
} from '@/app/(crm)/customers/actions';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { useIsLgUp } from '@/hooks/use-media-query';
import { cn } from '@/lib/cn';
import type { SprintDayDetail, SprintDaySpec, SprintOverview } from '@/utils/api';

type SprintCheckInEditorDialogProps = {
  leadId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialLocalDate?: string;
};

type DraftState = {
  baseSteps: boolean;
  baseProteinVeg: boolean;
  baseUndereat: boolean;
  baseNoSnacking: boolean;
  bonus1Level: number;
  bonus2Level: number;
};

const emptyDraft = (): DraftState => ({
  baseSteps: false,
  baseProteinVeg: false,
  baseUndereat: false,
  baseNoSnacking: false,
  bonus1Level: 0,
  bonus2Level: 0,
});

function draftFromDetail(detail: SprintDayDetail | null): DraftState {
  if (!detail?.log) return emptyDraft();
  return {
    baseSteps: detail.log.baseSteps,
    baseProteinVeg: detail.log.baseProteinVeg,
    baseUndereat: detail.log.baseUndereat,
    baseNoSnacking: detail.log.baseNoSnacking,
    bonus1Level: detail.log.bonus1Level,
    bonus2Level: detail.log.bonus2Level,
  };
}

function baseValue(draft: DraftState, id: string): boolean {
  switch (id) {
    case 'steps':
      return draft.baseSteps;
    case 'protein_veg':
      return draft.baseProteinVeg;
    case 'undereat':
      return draft.baseUndereat;
    case 'no_snacking':
      return draft.baseNoSnacking;
    default:
      return false;
  }
}

function setBaseValue(draft: DraftState, id: string, value: boolean): DraftState {
  switch (id) {
    case 'steps':
      return { ...draft, baseSteps: value };
    case 'protein_veg':
      return { ...draft, baseProteinVeg: value };
    case 'undereat':
      return { ...draft, baseUndereat: value };
    case 'no_snacking':
      return { ...draft, baseNoSnacking: value };
    default:
      return draft;
  }
}

function pickInitialDay(overview: SprintOverview, prefer?: string | null): string | null {
  if (prefer && overview.days.some((d) => d.localDate === prefer)) return prefer;
  const logged = [...overview.days].reverse().find((d) => d.logged);
  if (logged) return logged.localDate;
  return overview.days[0]?.localDate ?? null;
}

export function SprintCheckInEditorDialog({
  leadId,
  open,
  onOpenChange,
  initialLocalDate,
}: SprintCheckInEditorDialogProps) {
  const isLgUp = useIsLgUp();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<SprintOverview | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detail, setDetail] = useState<SprintDayDetail | null>(null);
  const [draft, setDraft] = useState<DraftState>(emptyDraft());
  const [confirmReset, setConfirmReset] = useState(false);

  const spec: SprintDaySpec | undefined = detail?.spec;
  const weekGroups = useMemo(() => {
    if (!overview) return [];
    const map = new Map<number, typeof overview.days>();
    for (const day of overview.days) {
      const list = map.get(day.sprintWeek) ?? [];
      list.push(day);
      map.set(day.sprintWeek, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [overview]);

  const loadOverview = useCallback(
    async (preferDate?: string | null) => {
      setLoading(true);
      setOverviewError(null);
      const { result, error } = await getLeadSprintAction(leadId);
      if (error || !result) {
        setOverview(null);
        setOverviewError(error ?? 'Failed to load sprint overview.');
        setLoading(false);
        return;
      }
      setOverview(result);
      setSelectedDate(pickInitialDay(result, preferDate));
      setLoading(false);
    },
    [leadId]
  );

  const loadDay = useCallback(
    async (localDate: string) => {
      setLoading(true);
      setConfirmReset(false);
      const { result, error } = await getLeadSprintDayAction(leadId, localDate);
      if (error || !result) {
        toast({ message: error ?? 'Failed to load sprint day.', variant: 'error' });
        setDetail(null);
        setDraft(emptyDraft());
        setLoading(false);
        return;
      }
      setDetail(result);
      setDraft(draftFromDetail(result));
      setLoading(false);
    },
    [leadId, toast]
  );

  useEffect(() => {
    if (!open) return;
    void loadOverview(initialLocalDate);
  }, [open, loadOverview, initialLocalDate]);

  useEffect(() => {
    if (!open || !selectedDate) return;
    void loadDay(selectedDate);
  }, [open, selectedDate, loadDay]);

  const save = () => {
    if (!selectedDate) return;
    startTransition(async () => {
      const { result, error } = await putLeadSprintDayAction(leadId, {
        localDate: selectedDate,
        ...draft,
      });
      if (error || !result) {
        toast({ message: error ?? 'Failed to save sprint day.', variant: 'error' });
        return;
      }
      toast({ message: `Saved ${selectedDate} · ${result.log.points} pts`, variant: 'success' });
      setDetail({
        exists: true,
        localDate: selectedDate,
        spec: result.spec,
        log: result.log,
      });
      setDraft(draftFromDetail({ exists: true, localDate: selectedDate, log: result.log, spec: result.spec }));
      void loadOverview(selectedDate);
    });
  };

  const reset = () => {
    if (!selectedDate) return;
    startTransition(async () => {
      const { result, error } = await deleteLeadSprintDayAction(leadId, selectedDate);
      if (error || !result) {
        toast({ message: error ?? 'Failed to reset sprint day.', variant: 'error' });
        return;
      }
      toast({ message: `Reset ${selectedDate} — member can check in again`, variant: 'success' });
      setConfirmReset(false);
      setDetail({ exists: false, localDate: selectedDate, spec: detail?.spec });
      setDraft(emptyDraft());
      void loadOverview(selectedDate);
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isLgUp ? 'right' : 'full'} className={isLgUp ? 'max-w-xl' : undefined} showCloseButton>
        <SheetHeader>
          <SheetTitle>Sprint check-ins</SheetTitle>
          <SheetDescription>
            Superadmin only. View or edit a day, or reset so the member can submit again.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4 overflow-y-auto">
          {overviewError ? <p className="text-sm font-medium text-rose-600">{overviewError}</p> : null}

          {overview ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {overview.startsOn} → {overview.endsOn}
              </span>
              {' · '}
              {overview.eligible
                ? 'Eligible'
                : `Not eligible${overview.ineligibleReason ? ` (${overview.ineligibleReason})` : ''}`}
              {' · '}
              {overview.onboardingComplete ? 'Onboarded' : 'Intro incomplete'}
            </div>
          ) : null}

          {weekGroups.length ? (
            <div className="space-y-3">
              {weekGroups.map(([week, days]) => (
                <div key={week}>
                  <p className="mb-1.5 text-[11px] font-bold tracking-wide text-slate-400 uppercase">Week {week}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {days.map((day) => {
                      const selected = day.localDate === selectedDate;
                      return (
                        <button
                          key={day.localDate}
                          type="button"
                          disabled={loading || pending}
                          onClick={() => setSelectedDate(day.localDate)}
                          className={cn(
                            'rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition-colors',
                            selected
                              ? 'border-brand bg-brand text-white'
                              : day.logged
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-300'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          )}
                        >
                          <span className="block">{day.weekday.slice(0, 3)}</span>
                          <span className={cn('block text-[10px]', selected ? 'text-white/80' : 'text-slate-500')}>
                            {day.localDate.slice(5)}
                            {day.logged ? ` · ${day.points ?? 0}` : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {selectedDate && spec ? (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {spec.weekday} · {selectedDate}
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {detail?.exists ? `${detail.log?.points ?? 0} pts logged` : 'Not logged'}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">Daily actions</p>
                {spec.baseActions.map((action) => {
                  const on = baseValue(draft, action.id);
                  return (
                    <button
                      key={action.id}
                      type="button"
                      disabled={pending}
                      onClick={() => setDraft((d) => setBaseValue(d, action.id, !on))}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                        on
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                          : 'border-slate-200 bg-white text-slate-800'
                      )}
                    >
                      <span>{action.label}</span>
                      <span className={cn('text-xs font-bold', on ? 'text-emerald-700' : 'text-slate-400')}>
                        {on ? '+1' : '—'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {[
                [
                  'bonus1',
                  spec.bonus1,
                  draft.bonus1Level,
                  (n: number) => setDraft((d) => ({ ...d, bonus1Level: n })),
                ] as const,
                [
                  'bonus2',
                  spec.bonus2,
                  draft.bonus2Level,
                  (n: number) => setDraft((d) => ({ ...d, bonus2Level: n })),
                ] as const,
              ].map(([key, task, level, setLevel]) => (
                <div key={key} className="space-y-2">
                  <p className="text-[11px] font-bold tracking-wide text-slate-400 uppercase">{task.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setLevel(0)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
                        level === 0
                          ? 'border-slate-800 bg-slate-800 text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      )}
                    >
                      Skip
                    </button>
                    {task.options.map((opt) => (
                      <button
                        key={opt.points}
                        type="button"
                        disabled={pending}
                        onClick={() => setLevel(opt.points)}
                        className={cn(
                          'rounded-lg border px-2.5 py-1.5 text-xs font-semibold',
                          level === opt.points
                            ? 'border-brand bg-brand text-white'
                            : 'border-slate-200 bg-white text-slate-700'
                        )}
                      >
                        {opt.label} · +{opt.points}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : null}
        </SheetBody>

        <SheetFooter className="flex flex-col gap-2 sm:flex-col">
          {confirmReset ? (
            <div className="flex w-full flex-col gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm font-medium text-rose-900">
                Reset {selectedDate}? The log is deleted and the member can submit that day again.
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="light" disabled={pending} onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="danger" disabled={pending || !detail?.exists} onClick={reset}>
                  {pending ? 'Resetting…' : 'Confirm reset'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex w-full flex-wrap gap-2">
              <Button type="button" disabled={pending || !selectedDate || loading} onClick={save}>
                {pending ? 'Saving…' : detail?.exists ? 'Update day' : 'Create log'}
              </Button>
              <Button
                type="button"
                variant="light"
                disabled={pending || !detail?.exists}
                onClick={() => setConfirmReset(true)}
              >
                Reset day
              </Button>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
