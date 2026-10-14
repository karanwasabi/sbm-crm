'use client';

import { Megaphone, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { buildLeadDatabaseHref, MARKETING_FILTER_OPTIONS, type LeadDatabaseFilters } from '@/lib/lead-database-url';

type MarketingFilterPopoverProps = {
  filters: LeadDatabaseFilters;
};

export function MarketingFilterPopover({ filters }: MarketingFilterPopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(filters.marketing);
  const selectedSet = useMemo(() => new Set(draft), [draft]);

  const isFiltered = filters.marketing.length > 0;

  const apply = () => {
    router.push(buildLeadDatabaseHref(filters, { marketing: draft }));
    setOpen(false);
  };

  const clear = () => {
    setDraft([]);
    router.push(buildLeadDatabaseHref(filters, { marketing: [] }));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(filters.marketing);
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(isFiltered)}>
        <Megaphone className="h-3.5 w-3.5" />
        Marketing{isFiltered ? ` (${filters.marketing.length})` : ''}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by marketing contact</p>
        <div className="mt-3 space-y-1">
          {MARKETING_FILTER_OPTIONS.map((option) => {
            const active = selectedSet.has(option.id);
            return (
              <button
                key={option.id}
                type="button"
                className={`flex w-full rounded-xl px-3 py-2 text-left text-sm ${
                  active ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() =>
                  setDraft((current) =>
                    active ? current.filter((value) => value !== option.id) : [...current, option.id]
                  )
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
          {isFiltered || draft.length > 0 ? (
            <Button variant="light" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
