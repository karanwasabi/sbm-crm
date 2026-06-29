'use client';

import { Filter } from 'lucide-react';
import { FilterChip } from '@/components/ui/filter-chip';
import { Card } from '@/components/ui/card';
import { MarketingFilterPopover } from '@/components/crm/marketing-filter-popover';
import { TagFilterPopover } from '@/components/crm/tag-filter-popover';
import { LeadDatabaseSearch } from '@/components/crm/lead-database-search';
import {
  buildLeadDatabaseHref,
  countActiveLeadDatabaseFilters,
  type LeadDatabaseFilters,
} from '@/lib/lead-database-url';
import type { TagSuggestion } from '@/types/crm';
import { cn } from '@/lib/cn';

export type StageFilterOption = {
  id: string;
  label: string;
  count: string;
};

type FilterBarProps = {
  filters: LeadDatabaseFilters;
  stageOptions: StageFilterOption[];
  tagSuggestions: TagSuggestion[];
  onOpenFilters: () => void;
};

export function FilterBar({ filters, stageOptions, tagSuggestions, onOpenFilters }: FilterBarProps) {
  const advancedCount = countActiveLeadDatabaseFilters(filters);

  return (
    <Card padding="sm" className="space-y-3 p-4">
      <LeadDatabaseSearch filters={filters} />

      <div className="flex flex-wrap items-center gap-2.5">
        {stageOptions.map((stage) => (
          <FilterChip
            key={stage.id}
            href={buildLeadDatabaseHref(filters, { stage: stage.id })}
            active={filters.stage === stage.id}
            count={stage.count}
          >
            {stage.label}
          </FilterChip>
        ))}
        <div className="flex-1" />
        <MarketingFilterPopover filters={filters} />
        <TagFilterPopover filters={filters} suggestions={tagSuggestions} />
        <button
          type="button"
          onClick={onOpenFilters}
          className={cn(
            'inline-flex cursor-pointer items-center justify-center gap-2 border-x-0 border-t-0 border-b-[3px] font-semibold transition-all duration-100 outline-none',
            'rounded-2xl px-4 py-2.25 text-xs',
            advancedCount > 0
              ? 'border-b-brand-press bg-brand text-white shadow-brand'
              : 'border-b-slate-200 bg-white text-brand shadow-sm'
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          Filters{advancedCount > 0 ? ` (${advancedCount})` : ''}
        </button>
      </div>
    </Card>
  );
}
