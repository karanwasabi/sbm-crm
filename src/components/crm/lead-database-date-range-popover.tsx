'use client';

import { type LucideIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TextInput } from '@/components/ui/text-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { buildLeadDatabaseHref, type LeadDatabaseFilters } from '@/lib/lead-database-url';

type DateRangeField = 'added' | 'updated';

const DATE_RANGE_FIELDS: Record<
  DateRangeField,
  { label: string; fromKey: 'addedFrom' | 'updatedFrom'; toKey: 'addedTo' | 'updatedTo' }
> = {
  added: { label: 'Added', fromKey: 'addedFrom', toKey: 'addedTo' },
  updated: { label: 'Updated', fromKey: 'updatedFrom', toKey: 'updatedTo' },
};

type LeadDatabaseDateRangePopoverProps = {
  field: DateRangeField;
  icon: LucideIcon;
  filters: LeadDatabaseFilters;
};

export function LeadDatabaseDateRangePopover({ field, icon: Icon, filters }: LeadDatabaseDateRangePopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const config = DATE_RANGE_FIELDS[field];
  const fromValue = filters[config.fromKey];
  const toValue = filters[config.toKey];
  const [draftFrom, setDraftFrom] = useState(fromValue);
  const [draftTo, setDraftTo] = useState(toValue);
  const isFiltered = Boolean(fromValue || toValue);

  const apply = () => {
    router.push(
      buildLeadDatabaseHref(filters, {
        [config.fromKey]: draftFrom,
        [config.toKey]: draftTo,
      })
    );
    setOpen(false);
  };

  const clear = () => {
    setDraftFrom('');
    setDraftTo('');
    router.push(
      buildLeadDatabaseHref(filters, {
        [config.fromKey]: '',
        [config.toKey]: '',
      })
    );
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraftFrom(fromValue);
          setDraftTo(toValue);
        }
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(isFiltered)}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
        {isFiltered ? ' (1)' : ''}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">Filter by {config.label.toLowerCase()} date</p>
        <div className="mt-3 space-y-3">
          <div>
            <Label className="mb-1 block text-[11px] text-slate-500">From</Label>
            <TextInput type="date" value={draftFrom} onChange={setDraftFrom} className="w-full" />
          </div>
          <div>
            <Label className="mb-1 block text-[11px] text-slate-500">To</Label>
            <TextInput type="date" value={draftTo} onChange={setDraftTo} className="w-full" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
          {isFiltered || draftFrom || draftTo ? (
            <Button variant="light" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
