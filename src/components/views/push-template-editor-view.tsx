'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { ArrowLeft } from 'lucide-react';
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
import { Pill } from '@/components/ui/pill';
import { TextInput } from '@/components/ui/text-input';
import { useToast } from '@/components/ui/toast';
import type { PushSlot, PushTemplateDetail, PushTemplateEntry, PushTemplateStatus } from '@/utils/api';

const SLOTS: { slot: PushSlot; label: string; time: string }[] = [
  { slot: 'am_9', label: 'Effort log catch-up', time: '9:00 am' },
  { slot: 'pm_3', label: 'Nudge – Better effort', time: '3:00 pm' },
  { slot: 'pm_8', label: 'Effort log', time: '8:00 pm' },
  { slot: 'pm_9', label: 'Think about tomorrow', time: '9:00 pm' },
];

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/push-notifications"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 no-underline hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to templates
        </Link>
        <Pill tone={status === 'active' ? 'success' : status === 'archived' ? 'neutral' : 'warn'}>{status}</Pill>
      </div>

      <Card className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <Field label="Template name">
            <TextInput value={name} onChange={setName} disabled={pending} />
          </Field>
          <Field label="Status">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={status}
              disabled={pending}
              onChange={(event) => setStatus(event.target.value as PushTemplateStatus)}
            >
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="archived">archived</option>
            </select>
          </Field>
          <div className="flex items-end gap-2">
            <Button variant="primary" onClick={saveMeta} loading={pending}>
              Save settings
            </Button>
            <Button variant="ghost" onClick={removeTemplate} disabled={pending}>
              Delete
            </Button>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Only <span className="font-semibold">active</span> templates are sent by the worker. Day 1 of week 1 is the
          cohort <span className="font-semibold">starts_on</span> civil date.
        </p>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: maxWeek }, (_, index) => index + 1).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeek(w)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                  week === w ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Week {w}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="light" size="sm" onClick={addWeek} disabled={pending}>
              Add week
            </Button>
            <Button variant="ghost" size="sm" onClick={removeLastWeek} disabled={pending || maxWeek <= 1}>
              Remove last week
            </Button>
            <Button variant="primary" size="sm" onClick={saveEntries} loading={pending}>
              Save copy
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 7 }, (_, index) => index + 1).map((day) => (
            <div key={day} className="rounded-2xl border border-slate-100 bg-canvas-cool/40 p-3">
              <p className="mb-3 text-xs font-bold tracking-wide text-slate-500 uppercase">
                Day {day}
                {week === 1 && day === 1 ? ' · cohort starts_on' : ''}
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {SLOTS.map(({ slot, label, time }) => {
                  const cell = map.get(entryKey(week, day, slot)) ?? { title: '', body: '' };
                  return (
                    <div key={slot} className="rounded-xl border border-slate-100 bg-white p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <span className="text-[11px] font-semibold text-slate-400">{time}</span>
                      </div>
                      <div className="space-y-2">
                        <TextInput
                          value={cell.title}
                          onChange={(value) => setCell(day, slot, 'title', value)}
                          placeholder="Title"
                          disabled={pending}
                        />
                        <textarea
                          value={cell.body}
                          onChange={(event) => setCell(day, slot, 'body', event.target.value)}
                          placeholder="Body"
                          disabled={pending}
                          rows={2}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-brand"
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
