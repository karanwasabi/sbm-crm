'use client';

import type { ReactNode } from 'react';
import { SourcePerformanceTable } from '@/components/crm/source-performance-table';
import type { OfflineMetaEnrollmentsSummary, PerformanceReportMeta, SourcePerformanceRow } from '@/types/crm';

type SourcePerformanceSectionProps = {
  rows: SourcePerformanceRow[];
  offlineMetaEnrollments?: OfflineMetaEnrollmentsSummary | null;
  window?: PerformanceReportMeta | null;
  subtitle?: string;
  headerRight?: ReactNode;
  hideWindowSelector?: boolean;
};

export function SourcePerformanceSection({
  rows,
  offlineMetaEnrollments = null,
  window = null,
  subtitle,
  headerRight,
}: SourcePerformanceSectionProps) {
  return (
    <SourcePerformanceTable
      rows={rows}
      window={window}
      offlineMetaEnrollments={offlineMetaEnrollments}
      subtitle={subtitle}
      headerRight={headerRight}
    />
  );
}
