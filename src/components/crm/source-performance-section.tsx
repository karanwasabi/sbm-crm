'use client';

import { useState, useTransition } from 'react';
import { fetchSourcePerformance } from '@/app/(crm)/actions';
import { FilterChip } from '@/components/ui/filter-chip';
import { SourcePerformanceTable } from '@/components/crm/source-performance-table';
import { performanceWindowSubtitle } from '@/lib/performance-drilldown-url';
import type { PerformanceReportMeta, SourcePerformanceRow } from '@/types/crm';

type WindowOption = { label: string; days: number | 'all' };

const WINDOW_OPTIONS: WindowOption[] = [
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '1y', days: 365 },
  { label: 'All', days: 'all' },
];

function windowSubtitle(days: number | 'all', window: PerformanceReportMeta | null): string {
  const range = performanceWindowSubtitle(window, days);
  return `Leads by created_at · Purchases by paid_at · CVR = in-window conversion · ${range}. Meta Purchases include checkouts + renewals. Rows are not summable.`;
}

type SourcePerformanceSectionProps = {
  initialRows: SourcePerformanceRow[];
  initialWindow?: PerformanceReportMeta | null;
  initialDays?: number | 'all';
};

export function SourcePerformanceSection({
  initialRows,
  initialWindow = null,
  initialDays = 90,
}: SourcePerformanceSectionProps) {
  const [rows, setRows] = useState(initialRows);
  const [window, setWindow] = useState<PerformanceReportMeta | null>(initialWindow);
  const [selected, setSelected] = useState<number | 'all'>(initialDays);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const changeWindow = (days: number | 'all') => {
    if (days === selected) return;
    setSelected(days);
    setError(null);
    startTransition(async () => {
      const result = await fetchSourcePerformance(days);
      if (result.ok) {
        setRows(result.rows);
        setWindow(result.window);
      } else {
        setError(result.error);
      }
    });
  };

  const selector = (
    <div className="flex items-center gap-1.5">
      {WINDOW_OPTIONS.map((option) => (
        <FilterChip
          key={option.label}
          active={option.days === selected}
          pending={isPending && option.days === selected}
          onClick={() => changeWindow(option.days)}
        >
          {option.label}
        </FilterChip>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <SourcePerformanceTable
        rows={rows}
        window={window}
        subtitle={windowSubtitle(selected, window)}
        headerRight={selector}
      />
      {error ? <p className="px-1 text-xs font-medium text-danger-press">{error}</p> : null}
    </div>
  );
}
