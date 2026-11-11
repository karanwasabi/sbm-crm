'use client';

import {
  BadgeCheck,
  CalendarClock,
  CalendarPlus,
  CreditCard,
  Globe,
  GraduationCap,
  Layers,
  Megaphone,
  RefreshCw,
  UserRound,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { FilterChip } from '@/components/ui/filter-chip';
import { Card } from '@/components/ui/card';
import { EventSlotFilterSheet } from '@/components/crm/event-slot-filter-sheet';
import { FiltersSheet } from '@/components/crm/filters-sheet';
import { LeadDatabaseDateRangePopover } from '@/components/crm/lead-database-date-range-popover';
import { LeadDatabaseMultiSelectPopover } from '@/components/crm/lead-database-multi-select-popover';
import { MarketingFilterPopover } from '@/components/crm/marketing-filter-popover';
import { TagFilterSheet } from '@/components/crm/tag-filter-sheet';
import { LeadDatabaseUnseenUpdatesFilter } from '@/components/crm/lead-database-unseen-updates-filter';
import { LeadDatabasePhoneDuplicatesFilter } from '@/components/crm/lead-database-phone-duplicates-filter';
import { LeadDatabaseAccessExpiringFilter } from '@/components/crm/lead-database-access-expiring-filter';
import { LeadDatabaseStarsFilter } from '@/components/crm/lead-database-unredeemed-stars-filter';
import { LeadDatabaseCreatedByMeFilter } from '@/components/crm/lead-database-created-by-me-filter';
import { LeadDatabasePurchaseKindFilter } from '@/components/crm/lead-database-purchase-kind-filter';
import { LeadDatabasePerfSourceFilter } from '@/components/crm/lead-database-perf-source-filter';
import { LeadDatabaseExportButton } from '@/components/crm/lead-database-export-button';
import { LeadDatabaseBulkSendButton } from '@/components/crm/lead-database-bulk-send-button';
import { LeadDatabaseSearch } from '@/components/crm/lead-database-search';
import { useIsLgUp } from '@/hooks/use-media-query';
import type { EmailTemplate, WhatsAppTemplate } from '@/utils/api';
import {
  buildLeadDatabaseHref,
  isStageFilterActive,
  toggleStageFilter,
  type LeadDatabaseFilters,
} from '@/lib/lead-database-url';
import { countLeadDatabaseToolbarFilters } from '@/lib/lead-database-filter-count';
import { mergeRenewalDurationFilterOptions } from '@/lib/renewal-duration';
import type { LeadFilterOptions, TagSuggestion } from '@/types/crm';
import type { EventOption } from '@/types/events';

export type StageFilterOption = {
  id: string;
  label: string;
  count: string;
};

type FilterBarProps = {
  filters: LeadDatabaseFilters;
  stageOptions: StageFilterOption[];
  filterOptions: LeadFilterOptions;
  eventOptions?: EventOption[];
  tagSuggestions?: TagSuggestion[];
  emailTemplates?: EmailTemplate[];
  whatsappTemplates?: WhatsAppTemplate[];
  whatsappSendsEnabled?: boolean;
  unseenUpdatesCount: number;
  restrictToCreatedByMe?: boolean;
};

function LeadDatabaseFilterControls({
  filters,
  filterOptions,
  eventOptions,
  tagSuggestions,
  unseenUpdatesCount,
  restrictToCreatedByMe,
}: {
  filters: LeadDatabaseFilters;
  filterOptions: LeadFilterOptions;
  eventOptions: EventOption[];
  tagSuggestions: TagSuggestion[];
  unseenUpdatesCount: number;
  restrictToCreatedByMe: boolean;
}) {
  return (
    <>
      <MarketingFilterPopover filters={filters} />
      <LeadDatabaseMultiSelectPopover
        label="Program"
        icon={GraduationCap}
        field="programs"
        filters={filters}
        options={filterOptions.programs}
      />
      <LeadDatabaseMultiSelectPopover
        label="Batch"
        icon={Layers}
        field="batches"
        filters={filters}
        options={filterOptions.batches}
      />
      <LeadDatabaseMultiSelectPopover
        label="Geography"
        icon={Globe}
        field="geography"
        filters={filters}
        options={filterOptions.geography}
      />
      <LeadDatabaseMultiSelectPopover
        label="Source"
        icon={Megaphone}
        field="sources"
        filters={filters}
        options={filterOptions.sources}
      />
      <LeadDatabaseMultiSelectPopover
        label="Coach"
        icon={UserRound}
        field="coaches"
        filters={filters}
        options={filterOptions.coaches}
      />
      <LeadDatabaseMultiSelectPopover
        label="Referrer's coach"
        icon={Users}
        field="referrerCoaches"
        filters={filters}
        options={filterOptions.referrerCoaches}
      />
      <LeadDatabaseMultiSelectPopover
        label="Renewal duration"
        icon={RefreshCw}
        field="renewalDurations"
        filters={filters}
        options={mergeRenewalDurationFilterOptions(filterOptions.renewalDurations)}
      />
      <EventSlotFilterSheet filters={filters} eventOptions={eventOptions} />
      <TagFilterSheet filters={filters} suggestions={tagSuggestions} />
      <LeadDatabaseDateRangePopover field="added" icon={CalendarPlus} filters={filters} />
      <LeadDatabaseDateRangePopover field="updated" icon={CalendarClock} filters={filters} />
      <LeadDatabaseDateRangePopover field="paid" icon={CreditCard} filters={filters} />
      <LeadDatabaseDateRangePopover field="converted" icon={BadgeCheck} filters={filters} />
      <LeadDatabasePurchaseKindFilter filters={filters} />
      <LeadDatabasePerfSourceFilter filters={filters} />
      <LeadDatabaseUnseenUpdatesFilter filters={filters} unseenCount={unseenUpdatesCount} />
      {restrictToCreatedByMe ? <LeadDatabaseCreatedByMeFilter filters={filters} /> : null}
      <LeadDatabasePhoneDuplicatesFilter filters={filters} />
      <LeadDatabaseStarsFilter filters={filters} />
      <LeadDatabaseAccessExpiringFilter filters={filters} />
    </>
  );
}

export function FilterBar({
  filters,
  stageOptions,
  filterOptions,
  eventOptions = [],
  tagSuggestions = [],
  emailTemplates = [],
  whatsappTemplates = [],
  whatsappSendsEnabled = false,
  unseenUpdatesCount,
  restrictToCreatedByMe = false,
}: FilterBarProps) {
  const toolbarFilterCount = countLeadDatabaseToolbarFilters(filters);
  const isLgUp = useIsLgUp();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  // Desktop-first: one filter-control tree (matches ResponsiveList).
  const showDesktopFilters = !ready || isLgUp;

  const filterControls = (
    <LeadDatabaseFilterControls
      filters={filters}
      filterOptions={filterOptions}
      eventOptions={eventOptions}
      tagSuggestions={tagSuggestions}
      unseenUpdatesCount={unseenUpdatesCount}
      restrictToCreatedByMe={restrictToCreatedByMe}
    />
  );

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-3 py-3 lg:px-4">
        <LeadDatabaseSearch filters={filters} className="w-full max-w-96 min-w-0 flex-1" />
        {showDesktopFilters ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">{filterControls}</div>
        ) : (
          <FiltersSheet activeCount={toolbarFilterCount}>
            <div className="flex flex-wrap gap-2">{filterControls}</div>
          </FiltersSheet>
        )}
        <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto">
          <LeadDatabaseBulkSendButton
            emailTemplates={emailTemplates}
            whatsappTemplates={whatsappTemplates}
            whatsappSendsEnabled={whatsappSendsEnabled}
            createdByMe={filters.createdByMe}
            restrictToCreatedByMe={restrictToCreatedByMe}
          />
          <LeadDatabaseExportButton />
        </div>
      </div>

      <div className="flex items-center gap-2 bg-white px-3 py-2.5 lg:gap-3 lg:px-4">
        <span className="shrink-0 text-[10px] font-bold tracking-wide text-slate-400 uppercase">Stage</span>
        <div className="-mx-1 flex min-w-0 flex-1 [scrollbar-width:thin] items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
          {stageOptions.map((stage) => (
            <FilterChip
              key={stage.id}
              href={buildLeadDatabaseHref(filters, toggleStageFilter(filters, stage.id))}
              active={isStageFilterActive(filters, stage.id)}
              count={stage.count}
            >
              {stage.label}
            </FilterChip>
          ))}
        </div>
      </div>
    </Card>
  );
}
