'use client';

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';
import { TagFilterPopover } from '@/components/crm/tag-filter-popover';
import { MARKETING_CONTACT_STATUS_LABELS } from '@/lib/email-template-types';
import { formatTagSlugsParam, tagSlugToLabel } from '@/lib/lead-tags';
import type { MarketingContactStatus, TagFilterMode, TagSuggestion } from '@/types/crm';

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

function buildHref(stageId: string, marketingStatus: string, tags: string[], tagMode: TagFilterMode): string {
  const params = new URLSearchParams();
  if (stageId !== 'all') params.set('stage', stageId);
  if (marketingStatus !== 'all') params.set('marketing', marketingStatus);
  if (tags.length > 0) params.set('tags', formatTagSlugsParam(tags));
  if (tags.length > 0 && tagMode === 'or') params.set('tag_mode', 'or');
  const query = params.toString();
  return query ? `/database?${query}` : '/database';
}

const MARKETING_FILTERS: Array<{ id: MarketingContactStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All contacts' },
  { id: 'active', label: MARKETING_CONTACT_STATUS_LABELS.active },
  { id: 'eligible', label: MARKETING_CONTACT_STATUS_LABELS.eligible },
  { id: 'no_consent', label: MARKETING_CONTACT_STATUS_LABELS.no_consent },
  { id: 'unsubscribed', label: MARKETING_CONTACT_STATUS_LABELS.unsubscribed },
];

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
            href={buildHref(stage.id, activeMarketingStatus, activeTags, activeTagMode)}
            active={activeStage === stage.id}
            count={stage.count}
          >
            {stage.label}
          </FilterChip>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <span className="text-[10px] font-bold tracking-[0.12em] text-slate-500 uppercase">Marketing</span>
        {MARKETING_FILTERS.map((filter) => (
          <FilterChip
            key={filter.id}
            href={buildHref(activeStage, filter.id, activeTags, activeTagMode)}
            active={activeMarketingStatus === filter.id}
          >
            {filter.label}
          </FilterChip>
        ))}
        <div className="flex-1" />
        {activeTags.length > 0 ? (
          <span className="text-[11px] text-slate-500">
            Tags: {activeTags.map((slug) => tagSlugToLabel(slug)).join(', ')} ({activeTagMode === 'and' ? 'all' : 'any'}
            )
          </span>
        ) : null}
        <Button variant="light" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />} disabled>
          More filters
        </Button>
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
