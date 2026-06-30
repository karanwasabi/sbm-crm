'use client';

import { useLeadDatabaseSelection } from '@/components/crm/lead-database-selection-context';
import type { LeadDatabaseFilters } from '@/lib/lead-database-url';
import { cn } from '@/lib/cn';

type LeadDatabaseSelectionControlsProps = {
  filters: LeadDatabaseFilters;
  filteredTotal: number;
};

export function LeadDatabaseSelectionControls({ filters, filteredTotal }: LeadDatabaseSelectionControlsProps) {
  const { selectedCount, selectAllFiltered, clearSelection } = useLeadDatabaseSelection();

  const allSelected = filteredTotal > 0 && selectedCount >= filteredTotal;
  const canSelectAll = filteredTotal > 0 && !allSelected;
  const canDeselectAll = selectedCount > 0;

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
      <span className="text-[13px] font-semibold text-slate-600">
        · {selectedCount.toLocaleString('en-IN')} selected
      </span>
      <span className="text-slate-300">·</span>
      <button
        type="button"
        onClick={() => selectAllFiltered(filters, filteredTotal)}
        disabled={!canSelectAll}
        className={cn(
          'text-[13px] font-semibold no-underline',
          canSelectAll ? 'cursor-pointer text-brand hover:text-brand-deep' : 'cursor-not-allowed text-slate-400'
        )}
      >
        Select all
      </button>
      <span className="text-slate-300">·</span>
      <button
        type="button"
        onClick={clearSelection}
        disabled={!canDeselectAll}
        className={cn(
          'text-[13px] font-semibold no-underline',
          canDeselectAll ? 'cursor-pointer text-brand hover:text-brand-deep' : 'cursor-not-allowed text-slate-400'
        )}
      >
        Deselect all
      </button>
    </span>
  );
}
