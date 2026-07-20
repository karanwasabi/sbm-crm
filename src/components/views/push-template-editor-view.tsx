'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { ArrowLeft, Clock3, Plus, Save, Trash2 } from 'lucide-react';
import {
  addPushTemplateWeekAction,
  deletePushTemplateAction,
  patchPushTemplateAction,
  putPushTemplateEntriesAction,
  removePushTemplateLastWeekAction,
} from '@/app/(crm)/push-notifications/actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FilterChip } from '@/components/ui/filter-chip';
import { Pill } from '@/components/ui/pill';
import { SectionHead } from '@/components/ui/section-head';
import { TextInput } from '@/components/ui/text-input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/cn';
import type { PushSlot, PushTemplateDetail, PushTemplateEntry, PushTemplateStatus } from '@/utils/api';

const SLOTS: { slot: PushSlot; label: string; time: string; accent: string; defaultTitle: string }[] = [
  { slot: 'am_9', label: 'Effort log catch-up', time: '9:00 am', accent: '#5C65CF', defaultTitle: 'Good Morning!' },
  { slot: 'pm_3', label: 'Nudge – Better effort', time: '3:00 pm', accent: '#0EA5E9', defaultTitle: 'Nudge' },
  { slot: 'pm_8', label: 'Effort log', time: '8:00 pm', accent: '#8B5CF6', defaultTitle: 'Check-in!' },
  {
    slot: 'pm_9',
    label: 'Think about tomorrow',
    time: '9:00 pm',
    accent: '#10B981',
    defaultTitle: 'Think about Tomorrow',
  },
];

const selectClassName =
  'w-full rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand disabled:bg-slate-50';

type PushTemplateEditorViewProps = {
  template: PushTemplateDetail;
};

function entryKey(week: number, day: number, slot: PushSlot) {
  return `${week}:${day}:${slot}`;
}

function buildMap(entries: PushTemplateEntry[]) {
  const map = new Map<string, { title: string; body: string }>();
  for (const entry of entries) {
    map.set(entryKey(entry.weekIndex, entry.dayIndex, entry.slot), {
      title: entry.title,
      body: entry.body,
    });
  }
  return map;
}

function statusTone(status: PushTemplateStatus): 'success' | 'neutral' | 'warn' {
  if (status === 'active') return 'success';
  if (status === 'archived') return 'neutral';
  return 'warn';
}

export function PushTemplateEditorView({ template }: PushTemplateEditorViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(template.name);
  const [status, setStatus] = useState<PushTemplateStatus>(template.status);
  const [week, setWeek] = useState(1);
  const [map, setMap] = useState(() => buildMap(template.entries));
  const maxWeek = useMemo(() => {
    let max = 1;
    for (const key of map.keys()) {
      const w = Number(key.split(':')[0]);
      if (w > max) max = w;
    }
    return Math.max(max, template.maxWeek || 1);
  }, [map, template.maxWeek]);

  const filledSlots = useMemo(() => {
    let filled = 0;
    for (let day = 1; day <= 7; day++) {
      for (const { slot } of SLOTS) {
        const cell = map.get(entryKey(week, day, slot));
        if (cell && cell.title.trim() && cell.body.trim()) filled += 1;
      }
    }
    return filled;
  }, [map, week]);

  const setCell = (day: number, slot: PushSlot, field: 'title' | 'body', value: string) => {
    const key = entryKey(week, day, slot);
    setMap((prev) => {
      const next = new Map(prev);
      const current = next.get(key) ?? { title: '', body: '' };
      next.set(key, { ...current, [field]: value });
      return next;
    });
  };

  const collectEntries = (): PushTemplateEntry[] => {
    const entries: PushTemplateEntry[] = [];
    for (let w = 1; w <= maxWeek; w++) {
      for (let day = 1; day <= 7; day++) {
        for (const { slot } of SLOTS) {
          const cell = map.get(entryKey(w, day, slot)) ?? { title: '', body: '' };
          entries.push({
            weekIndex: w,
            dayIndex: day,
            slot,
            title: cell.title,
            body: cell.body,
          });
        }
      }
    }
    return entries;
  };

  const saveMeta = () => {
    startTransition(async () => {
      try {
        if (status === 'active') {
          const incomplete = collectEntries().filter((e) => !e.title.trim() || !e.body.trim()).length;
          if (incomplete > 0) {
            toast({
              message: `Cannot activate: ${incomplete} slot(s) still need a title and body. Save copy first.`,
              variant: 'error',
            });
            return;
          }
        }
        await patchPushTemplateAction(template.id, { name: name.trim(), status });
        toast({ message: 'Template settings saved.', variant: 'success' });
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to save settings.',
          variant: 'error',
        });
      }
    });
  };

  const saveEntries = () => {
    startTransition(async () => {
      try {
        const updated = await putPushTemplateEntriesAction(template.id, collectEntries());
        setMap(buildMap(updated.entries));
        toast({ message: 'Notification copy saved.', variant: 'success' });
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to save entries.',
          variant: 'error',
        });
      }
    });
  };

  const addWeek = () => {
    startTransition(async () => {
      try {
        const updated = await addPushTemplateWeekAction(template.id);
        setMap(buildMap(updated.entries));
        setWeek(updated.maxWeek);
        toast({ message: `Week ${updated.maxWeek} added.`, variant: 'success' });
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to add week.',
          variant: 'error',
        });
      }
    });
  };

  const removeLastWeek = () => {
    if (maxWeek <= 1) return;
    const confirmed = window.confirm(`Remove week ${maxWeek} and its 28 slots?`);
    if (!confirmed) return;
    startTransition(async () => {
      try {
        const updated = await removePushTemplateLastWeekAction(template.id);
        setMap(buildMap(updated.entries));
        setWeek((current) => Math.min(current, updated.maxWeek || 1));
        toast({ message: 'Last week removed.', variant: 'success' });
        router.refresh();
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to remove week.',
          variant: 'error',
        });
      }
    });
  };

  const removeTemplate = () => {
    const confirmed = window.confirm('Delete this template? Cohort assignments will be cleared.');
    if (!confirmed) return;
    startTransition(async () => {
      try {
        await deletePushTemplateAction(template.id);
        toast({ message: 'Template deleted.', variant: 'success' });
        router.push('/push-notifications');
      } catch (error) {
        toast({
          message: error instanceof Error ? error.message : 'Failed to delete template.',
          variant: 'error',
        });
      }
    });
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[28px] border-b-[6px] border-[#4149AA] bg-linear-to-br from-brand from-0% via-[#6A71E6] via-55% to-brand-press to-100% px-6 py-6 text-white shadow-[0_12px_30px_-8px_rgba(92,101,207,0.30)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
          <div className="absolute -top-12 -right-8 h-60 w-60 rounded-full bg-white/18 blur-[36px]" />
        </div>
        <div className="relative z-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/push-notifications"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 no-underline hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to templates
            </Link>
            <Pill tone={statusTone(status)} className="border border-white/20 bg-white/15 text-white capitalize">
              {status}
            </Pill>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] font-bold tracking-[0.14em] text-white/70 uppercase">Push template</p>
              <h2 className="truncate text-2xl font-extrabold tracking-tight">{name || 'Untitled template'}</h2>
              <p className="text-sm font-medium text-white/80">
                Week {week} of {maxWeek} · {filledSlots}/28 slots filled this week
              </p>
            </div>
            <div className="inline-flex overflow-hidden rounded-2xl border border-white/20 bg-black/20">
              <div className="px-4 py-2.5 text-center">
                <p className="text-lg font-extrabold tabular-nums">{maxWeek}</p>
                <p className="text-[10px] font-bold tracking-wide text-white/70 uppercase">Weeks</p>
              </div>
              <div className="border-l border-white/15 px-4 py-2.5 text-center">
                <p className="text-lg font-extrabold tabular-nums">28</p>
                <p className="text-[10px] font-bold tracking-wide text-white/70 uppercase">Slots/wk</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card
        padding="md"
        className="border-[#B8BEF5] bg-linear-to-br from-[#F7F8FF] via-[#EEF0FF] to-[#E4E7FF] shadow-[0_1px_3px_rgba(92,101,207,0.08)]"
      >
        <SectionHead
          title="Template settings"
          subtitle="Only active templates are sent — and only when every slot has a title and body. Day 1 of week 1 is the cohort starts_on civil date."
          className="mb-4"
        />
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <Field label="Template name">
            <TextInput value={name} onChange={setName} disabled={pending} />
          </Field>
          <Field label="Status">
            <select
              className={selectClassName}
              value={status}
              disabled={pending}
              onChange={(event) => setStatus(event.target.value as PushTemplateStatus)}
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={saveMeta} loading={pending} leftIcon={<Save className="h-4 w-4" />}>
            Save settings
          </Button>
          <Button variant="ghost" onClick={removeTemplate} disabled={pending} leftIcon={<Trash2 className="h-4 w-4" />}>
            Delete template
          </Button>
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-linear-to-r from-brand/[0.06] via-white to-white px-5 py-4">
          <SectionHead
            title="Notification copy"
            subtitle={`Editing week ${week}. Empty title or body skips that send.`}
            className="mb-0"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="light"
              size="sm"
              onClick={addWeek}
              disabled={pending}
              leftIcon={<Plus className="h-3.5 w-3.5" />}
            >
              Add week
            </Button>
            <Button variant="ghost" size="sm" onClick={removeLastWeek} disabled={pending || maxWeek <= 1}>
              Remove last week
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={saveEntries}
              loading={pending}
              leftIcon={<Save className="h-3.5 w-3.5" />}
            >
              Save copy
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: maxWeek }, (_, index) => index + 1).map((w) => (
              <FilterChip key={w} active={week === w} onClick={() => setWeek(w)}>
                Week {w}
              </FilterChip>
            ))}
          </div>

          {Array.from({ length: 7 }, (_, index) => index + 1).map((day) => (
            <div
              key={day}
              className="overflow-hidden rounded-[22px] border border-slate-100 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="border-b border-slate-100 bg-linear-to-r from-brand/[0.07] via-[#F7F8FF] to-white px-4 py-3">
                <p className="text-xs font-bold tracking-[0.12em] text-slate-600 uppercase">
                  Day {day}
                  {week === 1 && day === 1 ? (
                    <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold tracking-normal text-brand normal-case">
                      cohort starts_on
                    </span>
                  ) : null}
                </p>
              </div>
              <div className="grid gap-3 p-4 lg:grid-cols-2">
                {SLOTS.map(({ slot, label, time, accent, defaultTitle }) => {
                  const cell = map.get(entryKey(week, day, slot)) ?? { title: '', body: '' };
                  const ready = Boolean(cell.title.trim() && cell.body.trim());
                  return (
                    <div
                      key={slot}
                      className={cn(
                        'rounded-2xl border border-slate-100 bg-linear-to-br from-white via-white to-slate-50/80 p-3.5',
                        ready && 'border-[#B8BEF5]'
                      )}
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">{label}</p>
                          <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                            <Clock3 className="h-3 w-3" style={{ color: accent }} aria-hidden />
                            {time}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold',
                            ready ? 'bg-success-press/10 text-success-press' : 'bg-slate-100 text-slate-500'
                          )}
                        >
                          {ready ? 'Ready' : 'Empty'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <TextInput
                          value={cell.title}
                          onChange={(value) => setCell(day, slot, 'title', value)}
                          placeholder={defaultTitle}
                          disabled={pending}
                        />
                        <Textarea
                          value={cell.body}
                          onChange={(event) => setCell(day, slot, 'body', event.target.value)}
                          placeholder="Body"
                          disabled={pending}
                          rows={2}
                          className="min-h-[72px] rounded-2xl border-[1.5px] border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-none focus-visible:border-brand focus-visible:ring-0"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
