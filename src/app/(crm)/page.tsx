import { redirectMarketingToDatabase } from '@/lib/marketing-access';
import { DashboardView } from '@/components/views/dashboard-view';
import { emptyDashboardAnalytics } from '@/lib/dashboard-analytics';
import { getDashboardAnalytics, getSourcePerformance } from '@/utils/api';
import type { PerformanceReportMeta, SourcePerformanceRow } from '@/types/crm';

export default async function DashboardPage() {
  await redirectMarketingToDatabase();

  let analytics = emptyDashboardAnalytics();
  let sourcePerformance: SourcePerformanceRow[] = [];
  let sourcePerformanceWindow: PerformanceReportMeta | null = null;
  let analyticsError: string | null = null;

  try {
    analytics = await getDashboardAnalytics();
  } catch {
    analyticsError = 'Dashboard metrics could not be loaded. Check that the backend is running the latest version.';
  }

  try {
    const perf = await getSourcePerformance();
    sourcePerformance = perf.rows;
    sourcePerformanceWindow = perf.window;
  } catch {
    if (!analyticsError) {
      analyticsError = 'Source performance could not be loaded.';
    }
  }

  return (
    <DashboardView
      analytics={analytics}
      sourcePerformance={sourcePerformance}
      sourcePerformanceWindow={sourcePerformanceWindow}
      analyticsError={analyticsError}
    />
  );
}
