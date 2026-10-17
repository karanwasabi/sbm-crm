'use client';

import { Layers, Megaphone, Search, Tags } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState, useTransition, type ReactNode } from 'react';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { ActiveFilterTag } from '@/components/ui/active-filter-tag';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDebouncedSearchInput } from '@/hooks/use-debounced-search-input';
import { cn } from '@/lib/cn';
import {
  buildCommsTemplatesHref,
  DEFAULT_COMMS_TEMPLATE_FILTERS,
  type CommsTemplateFilters,
} from '@/lib/comms-templates-query';

type ChipOption = { value: string; label: string };

type CommsTemplatesToolbarProps = {
  filters: CommsTemplateFilters;
  statusOptions: ChipOption[];
  classificationOptions?: ChipOption[];
  categoryOptions?: ChipOption[];
  purposeOptions?: ChipOption[];
  total: number;
  accountSelect?: ReactNode;
};

function labelFor(options: ChipOption[], value: string): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

function hasSecondaryFilters(filters: CommsTemplateFilters): boolean {
  return Boolean(filters.q || filters.status || filters.classification || filters.category || filters.purpose);
}

function TemplateFilterPopover({
  label,
  icon: Icon,
  value,
  options,
  onSelect,
}: {
  label: string;
  icon: typeof Layers;
  value: string;
  options: ChipOption[];
  onSelect: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value ? labelFor(options, value) : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(Boolean(value))}>
        <Icon className="h-3.5 w-3.5" />
        {selectedLabel ? `${label}: ${selectedLabel}` : label}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <p className="text-sm font-semibold text-slate-800">Filter by {label.toLowerCase()}</p>
        <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {options.map((option) => {
            const active = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
                  active ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
                )}
                onClick={() => {
                  onSelect(active ? '' : option.value);
                  setOpen(false);
                }}
              >
                <span className="truncate pr-2">{option.label}</span>
              </button>
            );
          })}
        </div>
        {value ? (
          <div className="mt-4">
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                onSelect('');
                setOpen(false);
              }}
            >
              Clear
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function CommsTemplatesToolbar({
  filters,
  statusOptions,
  classificationOptions,
  categoryOptions,
  purposeOptions,
  total,
  accountSelect,
}: CommsTemplatesToolbarProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const navigate = useCallback(
    (href: string) => {
      startTransition(() => {
        router.push(href);
      });
    },
    [router]
  );

  const pushPatch = useCallback(
    (patch: Partial<CommsTemplateFilters>) => {
      navigate(buildCommsTemplatesHref(filtersRef.current, patch));
    },
    [navigate]
  );

  const onCommitSearch = useCallback(
    (trimmedQuery: string) => {
      navigate(buildCommsTemplatesHref(filtersRef.current, { q: trimmedQuery }));
    },
    [navigate]
  );

  const {
    value: draftQ,
    setValue: setDraftQ,
    inputRef,
    onBlur,
    onKeyDown,
  } = useDebouncedSearchInput({
    committedQuery: filters.q,
    debounceMs: 400,
    onCommit: onCommitSearch,
  });

  const clearFilters = () => {
    navigate(
      buildCommsTemplatesHref({
        ...DEFAULT_COMMS_TEMPLATE_FILTERS,
        channel: filters.channel,
        accountId: filters.accountId,
      })
    );
  };

  const secondaryActive = hasSecondaryFilters(filters);

  return (
    <Card padding="none" className={cn('mb-4 overflow-hidden', pending && 'opacity-70')}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-4 py-3">
        <div className="flex w-full max-w-96 min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3.5 py-2.25 shadow-sm">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            type="search"
            value={draftQ}
            onChange={(event) => setDraftQ(event.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            placeholder={filters.channel === 'email' ? 'Search name or subject…' : 'Search template name…'}
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 border-none bg-transparent text-[13px] font-medium text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {accountSelect ? <div className="max-w-xs min-w-[14rem] flex-1">{accountSelect}</div> : null}
          {filters.channel === 'email' && classificationOptions ? (
            <TemplateFilterPopover
              label="Type"
              icon={Tags}
              value={filters.classification}
              options={classificationOptions}
              onSelect={(classification) => pushPatch({ classification })}
            />
          ) : null}
          {filters.channel === 'whatsapp' && categoryOptions ? (
            <TemplateFilterPopover
              label="Category"
              icon={Layers}
              value={filters.category}
              options={categoryOptions}
              onSelect={(category) => pushPatch({ category })}
            />
          ) : null}
          {filters.channel === 'whatsapp' && purposeOptions ? (
            <TemplateFilterPopover
              label="Purpose"
              icon={Megaphone}
              value={filters.purpose}
              options={purposeOptions}
              onSelect={(purpose) => pushPatch({ purpose })}
            />
          ) : null}
        </div>

        <p className="ml-auto shrink-0 text-xs font-semibold text-slate-500">
          {total.toLocaleString('en-IN')} matching
        </p>
      </div>

      <div className="flex items-center gap-3 bg-white px-4 py-2.5">
        <span className="shrink-0 text-[10px] font-bold tracking-wide text-slate-400 uppercase">Status</span>
        <div className="-mx-1 flex min-w-0 flex-1 [scrollbar-width:thin] items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
          <FilterChip active={filters.status === ''} onClick={() => pushPatch({ status: '' })}>
            All
          </FilterChip>
          {statusOptions.map((option) => (
            <FilterChip
              key={option.value}
              active={filters.status === option.value}
              onClick={() => pushPatch({ status: option.value })}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {secondaryActive ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2.5">
          {filters.q ? (
            <ActiveFilterTag label="Search" value={filters.q} onDismiss={() => pushPatch({ q: '' })} />
          ) : null}
          {filters.status ? (
            <ActiveFilterTag
              label="Status"
              value={labelFor(statusOptions, filters.status)}
              onDismiss={() => pushPatch({ status: '' })}
            />
          ) : null}
          {filters.classification ? (
            <ActiveFilterTag
              label="Type"
              value={labelFor(classificationOptions ?? [], filters.classification)}
              onDismiss={() => pushPatch({ classification: '' })}
            />
          ) : null}
          {filters.category ? (
            <ActiveFilterTag
              label="Category"
              value={labelFor(categoryOptions ?? [], filters.category)}
              onDismiss={() => pushPatch({ category: '' })}
            />
          ) : null}
          {filters.purpose ? (
            <ActiveFilterTag
              label="Purpose"
              value={labelFor(purposeOptions ?? [], filters.purpose)}
              onDismiss={() => pushPatch({ purpose: '' })}
            />
          ) : null}
          <button type="button" className="text-xs font-semibold text-brand" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      ) : null}
    </Card>
  );
}
