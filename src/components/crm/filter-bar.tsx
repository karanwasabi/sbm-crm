'use client';

import { Filter, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterChip } from '@/components/ui/filter-chip';

export type StageFilterOption = {
  id: string;
  label: string;
  count: string;
};

type FilterBarProps = {
  activeStage: string;
  stageOptions: StageFilterOption[];
};

function stageHref(stageId: string): string {
  return stageId === 'all' ? '/database' : `/database?stage=${encodeURIComponent(stageId)}`;
}

export function FilterBar({ activeStage, stageOptions }: FilterBarProps) {
  return (
    <Card padding="sm" className="p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        {stageOptions.map((stage) => (
          <FilterChip key={stage.id} href={stageHref(stage.id)} active={activeStage === stage.id} count={stage.count}>
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
    </Card>
  );
}
