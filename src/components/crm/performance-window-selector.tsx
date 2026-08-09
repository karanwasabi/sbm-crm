'use client';

import { FilterChip } from '@/components/ui/filter-chip';
import { PERFORMANCE_WINDOW_OPTIONS, type PerformanceWindowPreset } from '@/lib/performance-display';

type PerformanceWindowSelectorProps = {
  selected: PerformanceWindowPreset;
  pending?: boolean;
  onChange: (days: PerformanceWindowPreset) => void;
};

export function PerformanceWindowSelector({ selected, pending = false, onChange }: PerformanceWindowSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {PERFORMANCE_WINDOW_OPTIONS.map((option) => (
        <FilterChip
          key={option.label}
          active={option.days === selected}
          pending={pending && option.days === selected}
          onClick={() => onChange(option.days)}
        >
          {option.label}
        </FilterChip>
      ))}
    </div>
  );
}
