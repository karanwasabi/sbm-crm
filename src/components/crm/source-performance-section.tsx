'use client';

import { useMemo, useState, useTransition } from 'react';
import { fetchSourcePerformance } from '@/app/(crm)/actions';
import { PerformanceWindowSelector } from '@/components/crm/performance-window-selector';
import { SourcePerformanceTable } from '@/components/crm/source-performance-table';
import { formatPerformanceDateRange, type PerformanceWindowPreset } from '@/lib/performance-display';
import type { OfflineMetaEnrollmentsSummary, PerformanceReportMeta, SourcePerformanceRow } from '@/types/crm';

type SourcePerformanceSectionProps = {
  initialRows: SourcePerformanceRow[];
  initialOfflineMetaEnrollments?: OfflineMetaEnrollmentsSummary | null;
  initialWindow?: PerformanceReportMeta | null;
  initialDays?: PerformanceWindowPreset;
};

export function SourcePerformanceSection({
  initialRows,
  initialOfflineMetaEnrollments = null,
  initialWindow = null,
  initialDays = 90,
}: SourcePerformanceSectionProps) {
  const [rows, setRows] = useState(initialRows);
  const [offlineMetaEnrollments, setOfflineMetaEnrollments] = useState(initialOfflineMetaEnrollments);
  const [window, setWindow] = useState<PerformanceReportMeta | null>(initialWindow);
  const [selected, setSelected] = useState<PerformanceWindowPreset>(initialDays);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const changeWindow = (days: PerformanceWindowPreset) => {
    if (days === selected) return;
    setSelected(days);
    setError(null);
    startTransition(async () => {
      const result = await fetchSourcePerformance(days);
      if (result.ok) {
        setRows(result.rows);
        setWindow(result.window);
        setOfflineMetaEnrollments(result.offlineMetaEnrollments);
      } else {
        setError(result.error);
      }
    });
  };

  const subtitle = useMemo(() => formatPerformanceDateRange(window, selected), [window, selected]);

  const selector = <PerformanceWindowSelector selected={selected} pending={isPending} onChange={changeWindow} />;

  return (
    <div className="flex flex-col gap-2">
      <SourcePerformanceTable
        rows={rows}
        window={window}
        offlineMetaEnrollments={offlineMetaEnrollments}
        subtitle={subtitle}
        headerRight={selector}
      />
      {error ? <p className="px-1 text-xs font-medium text-danger-press">{error}</p> : null}
    </div>
  );
}
