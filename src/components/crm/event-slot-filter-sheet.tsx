'use client';

import { CalendarClock, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import type { EventOption } from '@/types/events';

type EventSlotFilterSheetProps = {
  filters: LeadDatabaseFilters;
  eventOptions: EventOption[];
};

type SlotOption = {
  id: string;
  label: string;
  startsAt: string;
};

type EventGroup = {
  id: string;
  name: string;
  slots: SlotOption[];
};

function buildEventGroups(eventOptions: EventOption[]): EventGroup[] {
  return eventOptions
    .map((event) => ({
      id: event.id,
      name: event.name,
      slots: [...event.slots]
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt) || a.label.localeCompare(b.label))
        .map((slot) => ({ id: slot.id, label: slot.label, startsAt: slot.startsAt })),
    }))
    .filter((event) => event.slots.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function filterEventGroups(groups: EventGroup[], query: string): EventGroup[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return groups;
  return groups
    .map((event) => {
      const eventMatch = event.name.toLowerCase().includes(normalized);
      const slots = eventMatch
        ? event.slots
        : event.slots.filter((slot) => slot.label.toLowerCase().includes(normalized));
      return { ...event, slots };
    })
    .filter((event) => event.slots.length > 0);
}

export function EventSlotFilterSheet({ filters, eventOptions }: EventSlotFilterSheetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(filters.eventSlotIds);
  const [searchQuery, setSearchQuery] = useState('');

  const groups = useMemo(() => buildEventGroups(eventOptions), [eventOptions]);
  const visibleGroups = useMemo(() => filterEventGroups(groups, searchQuery), [groups, searchQuery]);
  const visibleSlotIds = useMemo(
    () => visibleGroups.flatMap((event) => event.slots.map((slot) => slot.id)),
    [visibleGroups]
  );

  const selectedCount = filters.eventSlotIds.length;
  const draftSelected = useMemo(() => new Set(draft), [draft]);

  const resetDraft = () => {
    setDraft(filters.eventSlotIds);
    setSearchQuery('');
  };

  const apply = () => {
    router.push(
      buildLeadDatabaseHref(filters, {
        eventSlotIds: draft,
        // Slot filter replaces the old Event filter — drop leftover event_ids.
        eventIds: [],
      })
    );
    setOpen(false);
  };

  const clearAll = () => {
    setDraft([]);
    router.push(buildLeadDatabaseHref(filters, { eventSlotIds: [], eventIds: [] }));
    setOpen(false);
  };

  const toggleSlot = (slotId: string, checked: boolean) => {
    setDraft((current) => (checked ? [...current, slotId] : current.filter((id) => id !== slotId)));
  };

  const selectAllVisible = () => {
    setDraft((current) => Array.from(new Set([...current, ...visibleSlotIds])));
  };

  const clearVisible = () => {
    const visible = new Set(visibleSlotIds);
    setDraft((current) => current.filter((id) => !visible.has(id)));
  };

  const selectEventSlots = (event: EventGroup) => {
    const ids = event.slots.map((slot) => slot.id);
    setDraft((current) => Array.from(new Set([...current, ...ids])));
  };

  const clearEventSlots = (event: EventGroup) => {
    const ids = new Set(event.slots.map((slot) => slot.id));
    setDraft((current) => current.filter((id) => !ids.has(id)));
  };

  if (groups.length === 0) {
    return null;
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetDraft();
      }}
    >
      <SheetTrigger type="button" className={filterPopoverTriggerClass(selectedCount > 0)}>
        <CalendarClock className="h-3.5 w-3.5" />
        Event slot{selectedCount > 0 ? ` (${selectedCount})` : ''}
      </SheetTrigger>
      <SheetContent className="max-w-[420px]">
        <SheetHeader>
          <SheetTitle>Event slot filters</SheetTitle>
          <SheetDescription>Show leads registered for one or more event slots.</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search events or slots…"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <button
              type="button"
              className="text-brand hover:text-brand-press disabled:text-slate-300"
              disabled={visibleSlotIds.length === 0}
              onClick={selectAllVisible}
            >
              Select all
            </button>
            <span className="text-slate-300">·</span>
            <button
              type="button"
              className="text-slate-500 hover:text-slate-700 disabled:text-slate-300"
              disabled={draft.length === 0}
              onClick={clearVisible}
            >
              Clear
            </button>
          </div>

          {visibleGroups.length === 0 ? (
            <p className="rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-4 text-xs text-slate-500">
              No slots match your search.
            </p>
          ) : (
            <div className="space-y-4">
              {visibleGroups.map((event) => {
                const selectedInEvent = event.slots.filter((slot) => draftSelected.has(slot.id)).length;
                return (
                  <section key={event.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-[13px] font-semibold text-slate-800">{event.name}</h3>
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {selectedInEvent > 0
                            ? `${selectedInEvent} of ${event.slots.length} selected`
                            : `${event.slots.length} slot${event.slots.length === 1 ? '' : 's'}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-[11px] font-semibold">
                        <button
                          type="button"
                          className="text-brand hover:text-brand-press"
                          onClick={() => selectEventSlots(event)}
                        >
                          All
                        </button>
                        <span className="text-slate-300">·</span>
                        <button
                          type="button"
                          className="text-slate-500 hover:text-slate-700 disabled:text-slate-300"
                          disabled={selectedInEvent === 0}
                          onClick={() => clearEventSlots(event)}
                        >
                          None
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                      {event.slots.map((slot) => (
                        <Checkbox
                          key={slot.id}
                          checked={draftSelected.has(slot.id)}
                          onChange={(checked) => toggleSlot(slot.id, checked)}
                          className="rounded-lg px-2 py-2 hover:bg-white"
                          label={slot.label}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </SheetBody>

        <SheetFooter className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply{draft.length > 0 ? ` (${draft.length})` : ''}
          </Button>
          {selectedCount > 0 || draft.length > 0 ? (
            <Button variant="light" size="sm" onClick={clearAll}>
              Clear all
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
