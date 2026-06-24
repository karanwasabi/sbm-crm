'use client';

import { Filter, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';
import { MARKETING_CONTACT_STATUS_LABELS } from '@/lib/email-template-types';
import type { MarketingContactStatus } from '@/types/crm';

export type StageFilterOption = {
  id: string;
  label: string;
  count: string;
};

type FilterBarProps = {
  activeStage: string;
  stageOptions: StageFilterOption[];
  activeMarketingStatus?: string;
};

function buildHref(stageId: string, marketingStatus: string): string {
  const params = new URLSearchParams();
  if (stageId !== 'all') params.set('stage', stageId);
  if (marketingStatus !== 'all') params.set('marketing', marketingStatus);
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

export function FilterBar({ activeStage, stageOptions, activeMarketingStatus = 'all' }: FilterBarProps) {
  return (
    <Card padding="sm" className="p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        {stageOptions.map((stage) => (
          <FilterChip
            key={stage.id}
            href={buildHref(stage.id, activeMarketingStatus)}
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
            href={buildHref(activeStage, filter.id)}
            active={activeMarketingStatus === filter.id}
          >
            {filter.label}
          </FilterChip>
        ))}
        <div className="flex-1" />
        <Button variant="light" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />} disabled>
          More filters
        </Button>
        <Button variant="light" size="sm" leftIcon={<Tag className="h-3.5 w-3.5" />} disabled>
          Tags
        </Button>
      </div>
    </Card>
  );
}
