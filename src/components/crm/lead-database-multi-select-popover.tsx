'use client';

import { type LucideIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { leadSourceLabel } from '@/lib/lead-sources';

type MultiSelectField = 'programs' | 'batches' | 'geography' | 'sources' | 'coaches' | 'referrerCoaches';

type LeadDatabaseMultiSelectPopoverProps = {
  label: string;
  icon: LucideIcon;
  field: MultiSelectField;
  filters: LeadDatabaseFilters;
  options: { value: string; label?: string; count: number }[];
};

function optionLabel(field: MultiSelectField, option: { value: string; label?: string }): string {
  if (option.label) return option.label;
  if (field === 'sources') return leadSourceLabel(option.value) || option.value;
  if (field === 'coaches' && option.value === 'unassigned') return 'Unassigned';
  if (field === 'referrerCoaches' && option.value === 'unassigned') return 'Unassigned';
  return option.value;
}

export function LeadDatabaseMultiSelectPopover({
  label,
  icon: Icon,
  field,
  filters,
  options,
}: LeadDatabaseMultiSelectPopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const selected = filters[field];
  const [draft, setDraft] = useState<string[]>(selected);
  const selectedSet = useMemo(() => new Set(draft), [draft]);

  const apply = () => {
    router.push(buildLeadDatabaseHref(filters, { [field]: draft }));
    setOpen(false);
  };

  const clear = () => {
    setDraft([]);
    router.push(buildLeadDatabaseHref(filters, { [field]: [] }));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(selected);
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(selected.length > 0)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
        {selected.length > 0 ? ` (${selected.length})` : ''}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by {label.toLowerCase()}</p>
        <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">No values yet.</p>
          ) : (
            options.map((option) => {
              const active = selectedSet.has(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                    active ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() =>
                    setDraft((current) =>
                      active ? current.filter((value) => value !== option.value) : [...current, option.value]
                    )
                  }
                >
                  <span className="truncate pr-2">{optionLabel(field, option)}</span>
                  <span className="shrink-0 text-[10px] text-slate-400">{option.count.toLocaleString('en-IN')}</span>
                </button>
              );
            })
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
          {selected.length > 0 || draft.length > 0 ? (
            <Button variant="light" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
