'use client';

import { Megaphone, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
  const [draftStatus, setDraftStatus] = useState(filters.marketing);

  const isFiltered = filters.marketing !== 'all';

  const apply = () => {
    router.push(buildLeadDatabaseHref(filters, { marketing: draftStatus }));
    setOpen(false);
  };

  const clear = () => {
    setDraftStatus('all');
    router.push(buildLeadDatabaseHref(filters, { marketing: 'all' }));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraftStatus(filters.marketing);
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(isFiltered)}>
        <Megaphone className="h-3.5 w-3.5" />
        Marketing{isFiltered ? ' (1)' : ''}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by marketing contact</p>
        <div className="mt-3 space-y-1">
          {MARKETING_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`flex w-full rounded-xl px-3 py-2 text-left text-sm ${
                draftStatus === option.id ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => setDraftStatus(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
          {isFiltered ? (
            <Button variant="light" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
