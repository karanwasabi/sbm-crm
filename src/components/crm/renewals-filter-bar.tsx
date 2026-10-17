'use client';

import { CalendarClock, Layers, Shield, Tags, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { FilterChip } from '@/components/ui/filter-chip';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ActiveFilterTag } from '@/components/ui/active-filter-tag';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { RenewalsSearch } from '@/components/crm/renewals-search';
import { RenewalsBulkSendButton } from '@/components/crm/renewals-bulk-send-button';
import { RenewalsExportButton } from '@/components/crm/renewals-export-button';
import {
  RENEWAL_ACCESS_FILTERS,
  RENEWAL_BUCKET_FILTERS,
  RENEWAL_EXPIRY_FILTERS,
  RENEWAL_PRODUCT_FILTERS,
  RENEWAL_STATUS_FILTERS,
  filterCount,
  statusLabel,
  type RenewalBucketFilter,
} from '@/lib/renewal-display';
import { DEFAULT_RENEWAL_FILTERS, buildRenewalsHref, type RenewalFilters } from '@/lib/renewal-query';
import { cn } from '@/lib/cn';
import type { RenewalRow, RenewalSummary } from '@/types/crm';
import type { EmailTemplate, WhatsAppTemplate } from '@/utils/api';

type FacetCount = { value: string; count: number };

type FilterOption = { id: string; label: string; count?: number };

type RenewalsFilterBarProps = {
  filters: RenewalFilters;
  summary: RenewalSummary;
  onNavigate: (href: string) => void;
  pendingHref?: string | null;
  isNavigating?: boolean;
  leadIds: string[];
  skippedCount: number;
  emailTemplates: EmailTemplate[];
  whatsappTemplates: WhatsAppTemplate[];
  whatsappSendsEnabled: boolean;
  pageItems: RenewalRow[];
  selectedIds: Set<string>;
  selectAllFiltered: boolean;
  selectedCount: number;
};

export function RenewalsFilterBar({
  filters,
  summary,
  onNavigate,
  pendingHref,
  isNavigating = false,
  leadIds,
  skippedCount,
  emailTemplates,
  whatsappTemplates,
  whatsappSendsEnabled,
  pageItems,
  selectedIds,
  selectAllFiltered,
  selectedCount,
}: RenewalsFilterBarProps) {
  const displayedBucket = (filters.bucket || 'all') as RenewalBucketFilter;
  const secondaryActive =
    Boolean(filters.q) ||
    filters.products.length > 0 ||
    filters.statuses.length > 0 ||
    filters.access.length > 0 ||
    filters.expiries.length > 0 ||
    filters.batches.length > 0;

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-4 py-3">
        <RenewalsSearch filters={filters} onNavigate={onNavigate} className="w-full max-w-96 flex-1" />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <RenewalMultiSelectPopover
            label="Product"
            icon={Layers}
            values={filters.products}
            options={withCounts(RENEWAL_PRODUCT_FILTERS, summary.facets.products)}
            onApply={(products) => onNavigate(buildRenewalsHref(filters, { products }))}
          />
          <RenewalMultiSelectPopover
            label="Status"
            icon={Tags}
            values={filters.statuses}
            options={statusOptions(summary)}
            onApply={(statuses) => onNavigate(buildRenewalsHref(filters, { statuses }))}
          />
          <RenewalMultiSelectPopover
            label="Batch"
            icon={Users}
            values={filters.batches}
            options={batchOptions(summary)}
            onApply={(batches) => onNavigate(buildRenewalsHref(filters, { batches }))}
          />
          <RenewalMultiSelectPopover
            label="Access"
            icon={Shield}
            values={filters.access}
            options={withCounts(RENEWAL_ACCESS_FILTERS, summary.facets.access)}
            onApply={(access) => onNavigate(buildRenewalsHref(filters, { access }))}
          />
          <RenewalMultiSelectPopover
            label="Expires"
            icon={CalendarClock}
            values={filters.expiries}
            options={RENEWAL_EXPIRY_FILTERS}
            onApply={(expiries) => onNavigate(buildRenewalsHref(filters, { expiries }))}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white px-4 py-2.5">
        <span className="shrink-0 text-[10px] font-bold tracking-wide text-slate-400 uppercase">Retention</span>
        <div className="-mx-1 flex min-w-0 flex-1 [scrollbar-width:thin] items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
          {RENEWAL_BUCKET_FILTERS.map((filter) => {
            const href = buildRenewalsHref(filters, { bucket: filter.id === 'all' ? '' : filter.id });
            return (
              <FilterChip
                key={filter.id}
                onClick={() => onNavigate(href)}
                active={displayedBucket === filter.id}
                pending={isNavigating && pendingHref === href}
                count={filterCount(summary, filter.id)}
              >
                {filter.label}
              </FilterChip>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {leadIds.length > 0 || skippedCount > 0 ? (
            <RenewalsBulkSendButton
              leadIds={leadIds}
              skippedCount={skippedCount}
              emailTemplates={emailTemplates}
              whatsappTemplates={whatsappTemplates}
              whatsappSendsEnabled={whatsappSendsEnabled}
            />
          ) : null}
          <RenewalsExportButton
            filters={filters}
            pageItems={pageItems}
            selectedIds={selectedIds}
            selectAllFiltered={selectAllFiltered}
            selectedCount={selectedCount}
          />
        </div>
      </div>

      {secondaryActive ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-2.5">
          {filters.q ? (
            <ActiveFilterTag
              label="Search"
              value={filters.q}
              onDismiss={() => onNavigate(buildRenewalsHref(filters, { q: '' }))}
            />
          ) : null}
          {filters.products.map((product) => (
            <ActiveFilterTag
              key={`product-${product}`}
              label="Product"
              value={labelFor(RENEWAL_PRODUCT_FILTERS, product)}
              onDismiss={() =>
                onNavigate(
                  buildRenewalsHref(filters, {
                    products: filters.products.filter((item) => item !== product),
                  })
                )
              }
            />
          ))}
          {filters.statuses.map((status) => (
            <ActiveFilterTag
              key={`status-${status}`}
              label="Status"
              value={statusLabel(status)}
              onDismiss={() =>
                onNavigate(
                  buildRenewalsHref(filters, {
                    statuses: filters.statuses.filter((item) => item !== status),
                  })
                )
              }
            />
          ))}
          {filters.batches.map((batch) => (
            <ActiveFilterTag
              key={`batch-${batch}`}
              label="Batch"
              value={batch}
              onDismiss={() =>
                onNavigate(
                  buildRenewalsHref(filters, {
                    batches: filters.batches.filter((item) => item !== batch),
                  })
                )
              }
            />
          ))}
          {filters.access.map((access) => (
            <ActiveFilterTag
              key={`access-${access}`}
              label="Access"
              value={labelFor(RENEWAL_ACCESS_FILTERS, access)}
              onDismiss={() =>
                onNavigate(
                  buildRenewalsHref(filters, {
                    access: filters.access.filter((item) => item !== access),
                  })
                )
              }
            />
          ))}
          {filters.expiries.map((expiry) => (
            <ActiveFilterTag
              key={`expiry-${expiry}`}
              label="Expires"
              value={labelFor(RENEWAL_EXPIRY_FILTERS, expiry)}
              onDismiss={() =>
                onNavigate(
                  buildRenewalsHref(filters, {
                    expiries: filters.expiries.filter((item) => item !== expiry),
                  })
                )
              }
            />
          ))}
          <button
            type="button"
            className="text-xs font-semibold text-brand"
            onClick={() => onNavigate(buildRenewalsHref({ ...DEFAULT_RENEWAL_FILTERS, bucket: filters.bucket }))}
          >
            Clear filters
          </button>
        </div>
      ) : null}
    </Card>
  );
}

function withCounts(options: { id: string; label: string }[], facets: FacetCount[]): FilterOption[] {
  return options.map((option) => ({
    ...option,
    count: facets.find((facet) => facet.value === option.id)?.count,
  }));
}

function statusOptions(summary: RenewalSummary): FilterOption[] {
  return RENEWAL_STATUS_FILTERS.map((option) => {
    const facets =
      option.id === 'renewal' || option.id === 'returnee' ? summary.facets.memberKinds : summary.facets.stages;
    return { ...option, count: facets.find((facet) => facet.value === option.id)?.count };
  });
}

function batchOptions(summary: RenewalSummary): FilterOption[] {
  return (summary.facets.batches ?? []).map((facet) => ({
    id: facet.value,
    label: facet.value,
    count: facet.count,
  }));
}

function labelFor(options: { id: string; label: string }[], value: string): string {
  return options.find((option) => option.id === value)?.label ?? value;
}

function RenewalMultiSelectPopover({
  label,
  icon: Icon,
  values,
  options,
  onApply,
}: {
  label: string;
  icon: typeof Layers;
  values: string[];
  options: FilterOption[];
  onApply: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(values);
  const selectedSet = useMemo(() => new Set(draft), [draft]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(values);
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(values.length > 0)}>
        <Icon className="h-3.5 w-3.5" />
        {label}
        {values.length > 0 ? ` (${values.length})` : ''}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <p className="text-sm font-semibold text-slate-800">Filter by {label.toLowerCase()}</p>
        <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {options.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-500">No values yet.</p>
          ) : (
            options.map((option) => {
              const active = selectedSet.has(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
                    active ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
                  )}
                  onClick={() =>
                    setDraft((current) =>
                      active ? current.filter((value) => value !== option.id) : [...current, option.id]
                    )
                  }
                >
                  <span className="truncate pr-2">{option.label}</span>
                  {option.count != null ? (
                    <span className="shrink-0 text-[10px] text-slate-400">{option.count.toLocaleString('en-IN')}</span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            Apply
          </Button>
          {values.length > 0 || draft.length > 0 ? (
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                setDraft([]);
                onApply([]);
                setOpen(false);
              }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
