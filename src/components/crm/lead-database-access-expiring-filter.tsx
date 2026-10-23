'use client';

import { CalendarClock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';
import { RENEWAL_EXPIRY_FILTERS } from '@/lib/renewal-display';

type LeadDatabaseAccessExpiringFilterProps = {
  filters: LeadDatabaseFilters;
};

export function LeadDatabaseAccessExpiringFilter({ filters }: LeadDatabaseAccessExpiringFilterProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(filters.accessExpiring);
  const selected = useMemo(() => new Set(draft), [draft]);
  const isFiltered = filters.accessExpiring.length > 0;

  const toggle = (id: string) => {
    setDraft((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const apply = () => {
    router.push(buildLeadDatabaseHref(filters, { accessExpiring: draft }));
    setOpen(false);
  };

  const clear = () => {
    setDraft([]);
    router.push(buildLeadDatabaseHref(filters, { accessExpiring: [] }));
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(filters.accessExpiring);
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(isFiltered)}>
        <CalendarClock className="h-3.5 w-3.5" />
        Access until{isFiltered ? ` (${filters.accessExpiring.length})` : ''}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by access until</p>
        <p className="mt-1 text-[11px] text-slate-500">
          Latest paid membership end. Combine with stars to find people who can still redeem.
        </p>
        <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {RENEWAL_EXPIRY_FILTERS.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-brand"
                checked={selected.has(option.id)}
                onChange={() => toggle(option.id)}
              />
              {option.label}
            </label>
          ))}
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
