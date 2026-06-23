import { DashboardView } from '@/components/views/dashboard-view';
import { getDashboardAnalytics, getSourcePerformance } from '@/utils/api';
import type { DashboardAnalytics, SourcePerformanceRow } from '@/types/crm';

const EMPTY_ANALYTICS: DashboardAnalytics = {
  kpis: {
    newLeads7d: 0,
    newLeadsPrev7d: 0,
    conversionRate: 0,
    activeMembers: 0,
    activeCohorts: 0,
    revenueMtdPaise: 0,
    revenuePrevMtdPaise: 0,
    renewalsAtRisk: 0,
  },
  newLeadsSparkline: [0, 0, 0, 0, 0, 0, 0],
  funnel: [],
  revenueWeekly: [],
  geo: [],
};

export default async function DashboardPage() {
  let analytics = EMPTY_ANALYTICS;
  let sourcePerformance: SourcePerformanceRow[] = [];

  try {
    [analytics, sourcePerformance] = await Promise.all([getDashboardAnalytics(), getSourcePerformance()]);
  } catch {
    analytics = EMPTY_ANALYTICS;
    sourcePerformance = [];
  }

  return <DashboardView analytics={analytics} sourcePerformance={sourcePerformance} />;
}
