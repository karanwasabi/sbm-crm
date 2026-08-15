'use client';

import { CalendarClock, Layers, Shield, UserRound } from 'lucide-react';
import { useState } from 'react';
import { FilterChip } from '@/components/ui/filter-chip';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ActiveFilterTag } from '@/components/ui/active-filter-tag';
import { filterPopoverTriggerClass } from '@/components/crm/filter-popover-trigger';
import { RenewalsSearch } from '@/components/crm/renewals-search';
import { RenewalsBulkSendButton } from '@/components/crm/renewals-bulk-send-button';
import {
  RENEWAL_ACCESS_FILTERS,
  RENEWAL_BUCKET_FILTERS,
  RENEWAL_EXPIRY_FILTERS,
  RENEWAL_MEMBER_KIND_FILTERS,
  RENEWAL_PRODUCT_FILTERS,
  RENEWAL_STAGE_FILTERS,
  filterCount,
  type RenewalBucketFilter,
} from '@/lib/renewal-display';
import { DEFAULT_RENEWAL_FILTERS, buildRenewalsHref, type RenewalFilters } from '@/lib/renewal-query';
import { cn } from '@/lib/cn';
import type { RenewalSummary } from '@/types/crm';
import type { EmailTemplate, WhatsAppTemplate } from '@/utils/api';

type FacetCount = { value: string; count: number };

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
}: RenewalsFilterBarProps) {
  const displayedBucket = (filters.bucket || 'all') as RenewalBucketFilter;
  const secondaryActive =
    Boolean(filters.q) ||
    Boolean(filters.product) ||
    Boolean(filters.stage) ||
    Boolean(filters.memberKind) ||
    Boolean(filters.access) ||
    Boolean(filters.expiry);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-4 py-3">
        <RenewalsSearch filters={filters} onNavigate={onNavigate} className="w-full max-w-96 flex-1" />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <RenewalSelectPopover
            label="Product"
            icon={Layers}
            value={filters.product}
            options={withCounts(RENEWAL_PRODUCT_FILTERS, summary.facets.products)}
            onSelect={(product) => onNavigate(buildRenewalsHref(filters, { product }))}
          />
          <RenewalStageKindPopover
            stage={filters.stage}
            memberKind={filters.memberKind}
            stageOptions={withCounts(RENEWAL_STAGE_FILTERS, summary.facets.stages)}
            kindOptions={withCounts(RENEWAL_MEMBER_KIND_FILTERS, summary.facets.memberKinds)}
            onApply={(next) => onNavigate(buildRenewalsHref(filters, next))}
          />
          <RenewalSelectPopover
            label="Access"
            icon={Shield}
            value={filters.access}
            options={withCounts(RENEWAL_ACCESS_FILTERS, summary.facets.access)}
            onSelect={(access) => onNavigate(buildRenewalsHref(filters, { access }))}
          />
          <RenewalSelectPopover
            label="Expires"
            icon={CalendarClock}
            value={filters.expiry}
            options={RENEWAL_EXPIRY_FILTERS}
            onSelect={(expiry) => onNavigate(buildRenewalsHref(filters, { expiry }))}
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
          {filters.product ? (
            <ActiveFilterTag
              label="Product"
              value={labelFor(RENEWAL_PRODUCT_FILTERS, filters.product)}
              onDismiss={() => onNavigate(buildRenewalsHref(filters, { product: '' }))}
            />
          ) : null}
          {filters.stage || filters.memberKind ? (
            <ActiveFilterTag
              label="Stage"
              value={stageKindLabel(filters.stage, filters.memberKind)}
              onDismiss={() => onNavigate(buildRenewalsHref(filters, { stage: '', memberKind: '' }))}
            />
          ) : null}
          {filters.access ? (
            <ActiveFilterTag
              label="Access"
              value={labelFor(RENEWAL_ACCESS_FILTERS, filters.access)}
              onDismiss={() => onNavigate(buildRenewalsHref(filters, { access: '' }))}
            />
          ) : null}
          {filters.expiry ? (
            <ActiveFilterTag
              label="Expires"
              value={labelFor(RENEWAL_EXPIRY_FILTERS, filters.expiry)}
              onDismiss={() => onNavigate(buildRenewalsHref(filters, { expiry: '' }))}
            />
          ) : null}
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

function withCounts(
  options: { id: string; label: string }[],
  facets: FacetCount[]
): { id: string; label: string; count?: number }[] {
  return options.map((option) => ({
    ...option,
    count: facets.find((facet) => facet.value === option.id)?.count,
  }));
}

function labelFor(options: { id: string; label: string }[], value: string): string {
  return options.find((option) => option.id === value)?.label ?? value;
}

function stageKindLabel(stage: string, memberKind: string): string {
  return [
    stage ? labelFor(RENEWAL_STAGE_FILTERS, stage) : '',
    memberKind ? labelFor(RENEWAL_MEMBER_KIND_FILTERS, memberKind) : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

function RenewalSelectPopover({
  label,
  icon: Icon,
  value,
  options,
  onSelect,
}: {
  label: string;
  icon: typeof Layers;
  value: string;
  options: { id: string; label: string; count?: number }[];
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
            const active = value === option.id;
            return (
              <button
                key={option.id}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
                  active ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
                )}
                onClick={() => {
                  onSelect(active ? '' : option.id);
                  setOpen(false);
                }}
              >
                <span className="truncate pr-2">{option.label}</span>
                {option.count != null ? (
                  <span className="shrink-0 text-[10px] text-slate-400">{option.count.toLocaleString('en-IN')}</span>
                ) : null}
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

function OptionRow({
  option,
  active,
  onClick,
}: {
  option: { id: string; label: string; count?: number };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm',
        active ? 'bg-brand/10 font-semibold text-brand' : 'text-slate-700 hover:bg-slate-50'
      )}
      onClick={onClick}
    >
      <span className="truncate pr-2">{option.label}</span>
      {option.count != null ? (
        <span className="shrink-0 text-[10px] text-slate-400">{option.count.toLocaleString('en-IN')}</span>
      ) : null}
    </button>
  );
}

function RenewalStageKindPopover({
  stage,
  memberKind,
  stageOptions,
  kindOptions,
  onApply,
}: {
  stage: string;
  memberKind: string;
  stageOptions: { id: string; label: string; count?: number }[];
  kindOptions: { id: string; label: string; count?: number }[];
  onApply: (next: { stage: string; memberKind: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draftStage, setDraftStage] = useState(stage);
  const [draftKind, setDraftKind] = useState(memberKind);
  const selected = stageKindLabel(stage, memberKind);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraftStage(stage);
          setDraftKind(memberKind);
        }
      }}
    >
      <PopoverTrigger type="button" className={filterPopoverTriggerClass(Boolean(stage || memberKind))}>
        <UserRound className="h-3.5 w-3.5" />
        {selected ? `Stage: ${selected}` : 'Stage'}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="start">
        <p className="text-sm font-semibold text-slate-800">Filter by stage</p>
        <p className="mt-3 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Lifecycle</p>
        <div className="mt-1 space-y-1">
          {stageOptions.map((option) => (
            <OptionRow
              key={option.id}
              option={option}
              active={draftStage === option.id}
              onClick={() => setDraftStage(draftStage === option.id ? '' : option.id)}
            />
          ))}
        </div>
        <p className="mt-3 text-[10px] font-bold tracking-[0.12em] text-slate-400 uppercase">Member kind</p>
        <div className="mt-1 space-y-1">
          {kindOptions.map((option) => (
            <OptionRow
              key={option.id}
              option={option}
              active={draftKind === option.id}
              onClick={() => setDraftKind(draftKind === option.id ? '' : option.id)}
            />
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onApply({ stage: draftStage, memberKind: draftKind });
              setOpen(false);
            }}
          >
            Apply
          </Button>
          {stage || memberKind || draftStage || draftKind ? (
            <Button
              variant="light"
              size="sm"
              onClick={() => {
                setDraftStage('');
                setDraftKind('');
                onApply({ stage: '', memberKind: '' });
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
