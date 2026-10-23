'use client';

import { Star, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { STAR_BALANCE_FILTERS, type StarBalanceFilter } from '@/lib/star-balance';

type StarBalanceFilterPopoverProps = {
  value: StarBalanceFilter;
  onChange: (next: StarBalanceFilter) => void;
};

export function StarBalanceFilterPopover({ value, onChange }: StarBalanceFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<StarBalanceFilter>(value);
  const isFiltered = Boolean(value);

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const clear = () => {
    setDraft('');
    onChange('');
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(value);
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(isFiltered)}>
        <Star className="h-3.5 w-3.5" />
        Stars{isFiltered ? ' (1)' : ''}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by stars</p>
        <p className="mt-1 text-[11px] text-slate-500">Members who still have stars they can redeem.</p>
        <div className="mt-3 space-y-1">
          <FilterChoice active={draft === ''} label="Any" onClick={() => setDraft('')} />
          {STAR_BALANCE_FILTERS.map((option) => (
            <FilterChoice
              key={option.id}
              active={draft === option.id}
              label={option.label}
              onClick={() => setDraft(option.id)}
            />
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

function FilterChoice({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className={`flex w-full rounded-xl px-3 py-2 text-left text-sm ${
        active ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

type LeadDatabaseStarsFilterProps = {
  filters: LeadDatabaseFilters;
};

export function LeadDatabaseStarsFilter({ filters }: LeadDatabaseStarsFilterProps) {
  const router = useRouter();
  return (
    <StarBalanceFilterPopover
      value={filters.stars}
      onChange={(stars) => router.push(buildLeadDatabaseHref(filters, { stars }))}
    />
  );
}
