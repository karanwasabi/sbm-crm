'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TextInput } from '@/components/ui/text-input';
import type { LeadFilterOptions } from '@/types/crm';
import type { LeadDatabaseFilters, LeadDatabaseSort, LeadDatabaseSortOrder } from '@/lib/lead-database-url';

type MultiSelectFilterSectionProps = {
  title: string;
  options: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
};

export function MultiSelectFilterSection({ title, options, selected, onChange }: MultiSelectFilterSectionProps) {
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  return (
    <div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-1">
        {options.length === 0 ? (
          <p className="px-3 py-2 text-xs text-slate-500">No values yet.</p>
        ) : (
          options.map((option) => {
            const active = selectedSet.has(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                  active ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() =>
                  onChange(active ? selected.filter((value) => value !== option.value) : [...selected, option.value])
                }
              >
                <span className="truncate pr-2">{option.value}</span>
                <span className="shrink-0 text-[11px] text-slate-400">{option.count.toLocaleString('en-IN')}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

type DateRangeFilterSectionProps = {
  title: string;
  from: string;
  to: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
};

export function DateRangeFilterSection({ title, from, to, onFromChange, onToChange }: DateRangeFilterSectionProps) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <Label className="mb-1 block text-[11px] text-slate-500">From</Label>
          <TextInput type="date" value={from} onChange={onFromChange} />
        </div>
        <div>
          <Label className="mb-1 block text-[11px] text-slate-500">To</Label>
          <TextInput type="date" value={to} onChange={onToChange} />
        </div>
      </div>
    </div>
  );
}

type LeadDatabaseFiltersPanelProps = {
  open: boolean;
  filters: LeadDatabaseFilters;
  filterOptions: LeadFilterOptions;
  onClose: () => void;
  onApply: (patch: Partial<LeadDatabaseFilters>) => void;
  onClear: () => void;
};

const SORT_OPTIONS: Array<{ id: LeadDatabaseSort; label: string }> = [
  { id: 'created_at', label: 'Added' },
  { id: 'updated_at', label: 'Updated' },
  { id: 'name', label: 'Name' },
];

export function LeadDatabaseFiltersPanel({
  open,
  filters,
  filterOptions,
  onClose,
  onApply,
  onClear,
}: LeadDatabaseFiltersPanelProps) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  if (!open) return null;

  const setSort = (sort: LeadDatabaseSort) => setDraft((current) => ({ ...current, sort }));
  const setOrder = (order: LeadDatabaseSortOrder) => setDraft((current) => ({ ...current, order }));

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/20" aria-label="Close filters" onClick={onClose} />
      <aside className="fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          <p className="mt-1 text-sm text-slate-500">Program, batch, geography, dates, and sort.</p>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <MultiSelectFilterSection
            title="Program"
            options={filterOptions.programs}
            selected={draft.programs}
            onChange={(programs) => setDraft((current) => ({ ...current, programs }))}
          />
          <MultiSelectFilterSection
            title="Batch"
            options={filterOptions.batches}
            selected={draft.batches}
            onChange={(batches) => setDraft((current) => ({ ...current, batches }))}
          />
          <MultiSelectFilterSection
            title="Geography"
            options={filterOptions.geography}
            selected={draft.geography}
            onChange={(geography) => setDraft((current) => ({ ...current, geography }))}
          />
          <DateRangeFilterSection
            title="Added"
            from={draft.addedFrom}
            to={draft.addedTo}
            onFromChange={(addedFrom) => setDraft((current) => ({ ...current, addedFrom }))}
            onToChange={(addedTo) => setDraft((current) => ({ ...current, addedTo }))}
          />
          <DateRangeFilterSection
            title="Updated"
            from={draft.updatedFrom}
            to={draft.updatedTo}
            onFromChange={(updatedFrom) => setDraft((current) => ({ ...current, updatedFrom }))}
            onToChange={(updatedTo) => setDraft((current) => ({ ...current, updatedTo }))}
          />

          <div>
            <p className="text-sm font-semibold text-slate-800">Sort</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    draft.sort === option.id ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                  onClick={() => setSort(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {(['desc', 'asc'] as const).map((order) => (
                <button
                  key={order}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    draft.order === order ? 'bg-brand text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                  onClick={() => setOrder(order)}
                >
                  {order === 'desc' ? 'Descending' : 'Ascending'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 px-5 py-4">
          <Button
            variant="primary"
            onClick={() =>
              onApply({
                programs: draft.programs,
                batches: draft.batches,
                geography: draft.geography,
                addedFrom: draft.addedFrom,
                addedTo: draft.addedTo,
                updatedFrom: draft.updatedFrom,
                updatedTo: draft.updatedTo,
                sort: draft.sort,
                order: draft.order,
              })
            }
          >
            Apply filters
          </Button>
          <Button variant="light" onClick={onClear}>
            Clear all
          </Button>
        </div>
      </aside>
    </>
  );
}
