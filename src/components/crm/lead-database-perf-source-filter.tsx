'use client';

import { Target, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { PERF_SOURCE_FILTER_OPTIONS, perfSourceLabel } from '@/lib/lead-sources';

type LeadDatabasePerfSourceFilterProps = {
  filters: LeadDatabaseFilters;
};

export function LeadDatabasePerfSourceFilter({ filters }: LeadDatabasePerfSourceFilterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters.perfSource);
  const isFiltered = Boolean(filters.perfSource);

  const apply = () => {
    router.push(buildLeadDatabaseHref(filters, { perfSource: draft }));
    setOpen(false);
  };

  const clear = () => {
    setDraft('');
    router.push(buildLeadDatabaseHref(filters, { perfSource: '' }));
    setOpen(false);
  };

  const knownIds = new Set(PERF_SOURCE_FILTER_OPTIONS.map((option) => option.id));
  const options =
    filters.perfSource && !knownIds.has(filters.perfSource)
      ? [...PERF_SOURCE_FILTER_OPTIONS, { id: filters.perfSource, label: perfSourceLabel(filters.perfSource) }]
      : PERF_SOURCE_FILTER_OPTIONS;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(filters.perfSource);
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(isFiltered)}>
        <Target className="h-3.5 w-3.5" />
        Perf. source{isFiltered ? ' (1)' : ''}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by performance source</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Same as dashboard drilldown (Meta Influenced is not the META tag).
        </p>
        <div className="mt-3 max-h-64 space-y-1 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id || 'any'}
              type="button"
              className={`flex w-full rounded-xl px-3 py-2 text-left text-sm ${
                draft === option.id ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => setDraft(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
          {isFiltered || draft ? (
            <Button variant="light" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
