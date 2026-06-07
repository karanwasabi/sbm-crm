'use client';

import { Filter, Tag } from 'lucide-react';
import { ActiveFilterTag } from '@/components/ui/active-filter-tag';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { FilterChip } from '@/components/ui/filter-chip';
import { STAGE_FILTER_OPTIONS } from '@/lib/lifecycle-stages';

type ActiveFilter = { key: string; value: string };

type FilterBarProps = {
  activeStage: string;
  onStageChange: (stage: string) => void;
  activeFilters: ActiveFilter[];
};

export function FilterBar({ activeStage, onStageChange, activeFilters }: FilterBarProps) {
  return (
    <Card padding="sm" className="p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        {STAGE_FILTER_OPTIONS.map((stage) => (
          <FilterChip
            key={stage.id}
            active={activeStage === stage.id}
            count={stage.count}
            onClick={() => onStageChange(stage.id)}
          >
            {stage.label}
          </FilterChip>
        ))}
        <div className="flex-1" />
        <Button variant="light" size="sm" leftIcon={<Filter className="h-3.5 w-3.5" />}>
          More filters
        </Button>
        <Button variant="light" size="sm" leftIcon={<Tag className="h-3.5 w-3.5" />}>
          Tags
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3">
        <Eyebrow color="muted">Active filters</Eyebrow>
        {activeFilters.map((filter) => (
          <ActiveFilterTag key={filter.key} label={filter.key} value={filter.value} />
        ))}
        <button type="button" className="cursor-pointer border-none bg-transparent text-[11px] font-semibold text-slate-500">
          Clear all
        </button>
      </div>
    </Card>
  );
}
