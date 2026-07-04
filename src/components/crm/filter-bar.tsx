'use client';

import { CalendarClock, CalendarPlus, Globe, GraduationCap, Layers, Megaphone } from 'lucide-react';
import { FilterChip } from '@/components/ui/filter-chip';
import { Card } from '@/components/ui/card';
import { LeadDatabaseDateRangePopover } from '@/components/crm/lead-database-date-range-popover';
import { LeadDatabaseMultiSelectPopover } from '@/components/crm/lead-database-multi-select-popover';
import { MarketingFilterPopover } from '@/components/crm/marketing-filter-popover';
import { TagFilterPopover } from '@/components/crm/tag-filter-popover';
import { LeadDatabaseUnseenUpdatesFilter } from '@/components/crm/lead-database-unseen-updates-filter';
import { LeadDatabaseExportButton } from '@/components/crm/lead-database-export-button';
import { LeadDatabaseBulkSendButton } from '@/components/crm/lead-database-bulk-send-button';
import { LeadDatabaseSearch } from '@/components/crm/lead-database-search';
import type { EmailTemplate } from '@/utils/api';
import {
  buildLeadDatabaseHref,
  isStageFilterActive,
  toggleStageFilter,
  type LeadDatabaseFilters,
} from '@/lib/lead-database-url';
import type { LeadFilterOptions, TagSuggestion } from '@/types/crm';

export type StageFilterOption = {
  id: string;
  label: string;
  count: string;
};

type FilterBarProps = {
  filters: LeadDatabaseFilters;
  stageOptions: StageFilterOption[];
  filterOptions: LeadFilterOptions;
  tagSuggestions: TagSuggestion[];
  emailTemplates: EmailTemplate[];
  unseenUpdatesCount: number;
};

export function FilterBar({
  filters,
  stageOptions,
  filterOptions,
  tagSuggestions,
  emailTemplates,
  unseenUpdatesCount,
}: FilterBarProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-canvas-cool px-4 py-3">
        <LeadDatabaseSearch filters={filters} className="w-full max-w-96 flex-1" />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
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
          <TagFilterPopover filters={filters} suggestions={tagSuggestions} />
          <LeadDatabaseDateRangePopover field="added" icon={CalendarPlus} filters={filters} />
          <LeadDatabaseDateRangePopover field="updated" icon={CalendarClock} filters={filters} />
          <LeadDatabaseUnseenUpdatesFilter filters={filters} unseenCount={unseenUpdatesCount} />
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white px-4 py-2.5">
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
        <div className="flex shrink-0 items-center gap-2">
          <LeadDatabaseBulkSendButton templates={emailTemplates} />
          <LeadDatabaseExportButton />
        </div>
      </div>
    </Card>
  );
}
