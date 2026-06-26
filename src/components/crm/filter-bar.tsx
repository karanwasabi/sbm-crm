'use client';

import { FilterChip } from '@/components/ui/filter-chip';
import { Card } from '@/components/ui/card';
import { MarketingFilterPopover } from '@/components/crm/marketing-filter-popover';
import { TagFilterPopover } from '@/components/crm/tag-filter-popover';
import { buildLeadDatabaseHref } from '@/lib/lead-database-url';
import type { TagFilterMode, TagSuggestion } from '@/types/crm';

export type StageFilterOption = {
  id: string;
  label: string;
  count: string;
};

type FilterBarProps = {
  activeStage: string;
  stageOptions: StageFilterOption[];
  activeMarketingStatus?: string;
  activeTags?: string[];
  activeTagMode?: TagFilterMode;
  tagSuggestions?: TagSuggestion[];
};

export function FilterBar({
  activeStage,
  stageOptions,
  activeMarketingStatus = 'all',
  activeTags = [],
  activeTagMode = 'and',
  tagSuggestions = [],
}: FilterBarProps) {
  return (
    <Card padding="sm" className="p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        {stageOptions.map((stage) => (
          <FilterChip
            key={stage.id}
            href={buildLeadDatabaseHref(stage.id, activeMarketingStatus, activeTags, activeTagMode)}
            active={activeStage === stage.id}
            count={stage.count}
          >
            {stage.label}
          </FilterChip>
        ))}
        <div className="flex-1" />
        <MarketingFilterPopover
          activeStage={activeStage}
          activeMarketingStatus={activeMarketingStatus}
          activeTags={activeTags}
          activeTagMode={activeTagMode}
        />
        <TagFilterPopover
          activeStage={activeStage}
          activeMarketingStatus={activeMarketingStatus}
          activeTags={activeTags}
          activeTagMode={activeTagMode}
          suggestions={tagSuggestions}
        />
      </div>
    </Card>
  );
}
