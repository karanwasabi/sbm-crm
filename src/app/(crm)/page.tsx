import { DashboardView } from '@/components/views/dashboard-view';
import { emptyDashboardAnalytics } from '@/lib/dashboard-analytics';
import { getDashboardAnalytics, getSourcePerformance } from '@/utils/api';
import type { SourcePerformanceRow } from '@/types/crm';

export default async function DashboardPage() {
  let analytics = emptyDashboardAnalytics();
  let sourcePerformance: SourcePerformanceRow[] = [];
  let analyticsError: string | null = null;

  try {
    analytics = await getDashboardAnalytics();
  } catch {
    analyticsError = 'Dashboard metrics could not be loaded. Check that the backend is running the latest version.';
  }

  try {
    sourcePerformance = await getSourcePerformance();
  } catch {
    if (!analyticsError) {
      analyticsError = 'Source performance could not be loaded.';
    }
  }

  return <DashboardView analytics={analytics} sourcePerformance={sourcePerformance} analyticsError={analyticsError} />;
}
