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
import { istDateInputsToPaidRange, paidRangeToISTDateInputs } from '@/lib/ist-datetime';

type DateRangeField = 'added' | 'updated' | 'paid' | 'converted';

const DATE_RANGE_FIELDS: Record<
  DateRangeField,
  {
    label: string;
    fromKey: 'addedFrom' | 'updatedFrom' | 'paidFrom' | 'convertedFrom';
    toKey: 'addedTo' | 'updatedTo' | 'paidTo' | 'convertedTo';
    hint: string;
    timestamp: boolean;
  }
> = {
  added: {
    label: 'Added',
    fromKey: 'addedFrom',
    toKey: 'addedTo',
    hint: 'Filter by lead created date.',
    timestamp: false,
  },
  updated: {
    label: 'Updated',
    fromKey: 'updatedFrom',
    toKey: 'updatedTo',
    hint: 'Filter by lead last updated date.',
    timestamp: false,
  },
  paid: {
    label: 'Paid',
    fromKey: 'paidFrom',
    toKey: 'paidTo',
    hint: 'Filter by checkout paid date (IST). Same as dashboard purchase drilldown.',
    timestamp: true,
  },
  converted: {
    label: 'Converted',
    fromKey: 'convertedFrom',
    toKey: 'convertedTo',
    hint: 'First successful payment. Later renewals do not move this date.',
    timestamp: true,
  },
};

type LeadDatabaseDateRangePopoverProps = {
  field: DateRangeField;
  icon: LucideIcon;
  filters: LeadDatabaseFilters;
};

function draftDatesForField(field: DateRangeField, filters: LeadDatabaseFilters): { from: string; to: string } {
  const config = DATE_RANGE_FIELDS[field];
  if (config.timestamp) {
    return paidRangeToISTDateInputs(filters[config.fromKey], filters[config.toKey]);
  }
  return { from: filters[config.fromKey], to: filters[config.toKey] };
}

type ConvertedChoice = '' | 'yes' | 'no';

function convertedChoice(filters: LeadDatabaseFilters): ConvertedChoice {
  if (filters.converted === 'no') return 'no';
  if (filters.converted === 'yes' || filters.convertedFrom || filters.convertedTo) return 'yes';
  return '';
}

export function LeadDatabaseDateRangePopover({ field, icon: Icon, filters }: LeadDatabaseDateRangePopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const config = DATE_RANGE_FIELDS[field];
  const convertedMode = field === 'converted';
  const current = draftDatesForField(field, filters);
  const [draftFrom, setDraftFrom] = useState(current.from);
  const [draftTo, setDraftTo] = useState(current.to);
  const [draftConverted, setDraftConverted] = useState<ConvertedChoice>(convertedChoice(filters));
  const isFiltered = convertedMode
    ? convertedChoice(filters) !== ''
    : Boolean(filters[config.fromKey] || filters[config.toKey]);
  const showDates = !convertedMode || draftConverted === 'yes';

  const apply = () => {
    if (convertedMode) {
      if (draftConverted === 'no') {
        router.push(buildLeadDatabaseHref(filters, { converted: 'no', convertedFrom: '', convertedTo: '' }));
      } else if (draftConverted === 'yes') {
        const { paidFrom, paidTo } = istDateInputsToPaidRange(draftFrom, draftTo);
        router.push(buildLeadDatabaseHref(filters, { converted: 'yes', convertedFrom: paidFrom, convertedTo: paidTo }));
      } else {
        router.push(buildLeadDatabaseHref(filters, { converted: '', convertedFrom: '', convertedTo: '' }));
      }
    } else if (config.timestamp) {
      const { paidFrom, paidTo } = istDateInputsToPaidRange(draftFrom, draftTo);
      router.push(
        buildLeadDatabaseHref(filters, {
          [config.fromKey]: paidFrom,
          [config.toKey]: paidTo,
        })
      );
    } else {
      router.push(
        buildLeadDatabaseHref(filters, {
          [config.fromKey]: draftFrom,
          [config.toKey]: draftTo,
        })
      );
    }
    setOpen(false);
  };

  const clear = () => {
    setDraftFrom('');
    setDraftTo('');
    setDraftConverted('');
    router.push(
      buildLeadDatabaseHref(filters, {
        [config.fromKey]: '',
        [config.toKey]: '',
        ...(convertedMode ? { converted: '' as const } : {}),
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
          const nextDraft = draftDatesForField(field, filters);
          setDraftFrom(convertedMode && convertedChoice(filters) === 'no' ? '' : nextDraft.from);
          setDraftTo(convertedMode && convertedChoice(filters) === 'no' ? '' : nextDraft.to);
          setDraftConverted(convertedChoice(filters));
        }
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(isFiltered)}>
        <Icon className="h-3.5 w-3.5" />
        {config.label}
        {isFiltered ? ' (1)' : ''}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="end">
        <p className="text-sm font-semibold text-slate-800">
          {convertedMode ? 'Filter by conversion' : `Filter by ${config.label.toLowerCase()} date`}
        </p>
        <p className="mt-1 text-[11px] text-slate-500">{config.hint}</p>
        {convertedMode ? (
          <div className="mt-3 space-y-1">
            {(
              [
                { id: '' as const, label: 'Any' },
                { id: 'yes' as const, label: 'Yes' },
                { id: 'no' as const, label: 'No' },
              ] as const
            ).map((option) => (
              <button
                key={option.id || 'any'}
                type="button"
                className={`flex w-full rounded-xl px-3 py-2 text-left text-sm ${
                  draftConverted === option.id
                    ? 'bg-brand/10 font-semibold text-brand'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => {
                  setDraftConverted(option.id);
                  if (option.id !== 'yes') {
                    setDraftFrom('');
                    setDraftTo('');
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
        {showDates ? (
          <div className="mt-3 space-y-3">
            {convertedMode ? <p className="text-[11px] text-slate-500">Dates are optional.</p> : null}
            <div>
              <Label className="mb-1 block text-[11px] text-slate-500">From</Label>
              <TextInput type="date" value={draftFrom} onChange={setDraftFrom} className="w-full" />
            </div>
            <div>
              <Label className="mb-1 block text-[11px] text-slate-500">To</Label>
              <TextInput type="date" value={draftTo} onChange={setDraftTo} className="w-full" />
            </div>
          </div>
        ) : null}
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={apply}>
            Apply
          </Button>
          {isFiltered || draftFrom || draftTo || draftConverted ? (
            <Button variant="light" size="sm" leftIcon={<X className="h-3.5 w-3.5" />} onClick={clear}>
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
