import { redirectMarketingToDatabase } from '@/lib/marketing-access';
import { DashboardPageClient } from '@/components/views/dashboard-page-client';
import { emptyDashboardAnalytics } from '@/lib/dashboard-analytics';
import type { DashboardPageData } from '@/app/(crm)/actions';
import {
  getAdPerformance,
  getDashboardAnalytics,
  getMetaAcquisitionByPlan,
  getMetaCampaignPerformance,
  getMetaInfluencedRenewals,
  getSourcePerformance,
} from '@/utils/api';
import type { PerformanceWindowPreset } from '@/lib/performance-display';

const DEFAULT_WINDOW: PerformanceWindowPreset = 90;

export default async function DashboardPage() {
  await redirectMarketingToDatabase();

  let initialData: DashboardPageData = {
    analytics: emptyDashboardAnalytics(),
    sourcePerformance: [],
    sourcePerformanceOfflineMeta: null,
    sourcePerformanceWindow: null,
    campaignPerformance: [],
    campaignPerformanceWindow: null,
    adPerformance: [],
    adPerformanceWindow: null,
    metaRenewals: [],
    metaRenewalsWindow: null,
    metaAcquisitionByPlan: [],
    metaAcquisitionByPlanWindow: null,
  };
  let analyticsError: string | null = null;

  try {
    const [analytics, source, campaigns, ads, renewals, acquisition] = await Promise.all([
      getDashboardAnalytics(DEFAULT_WINDOW),
      getSourcePerformance(DEFAULT_WINDOW),
      getMetaCampaignPerformance(DEFAULT_WINDOW),
      getAdPerformance(DEFAULT_WINDOW),
      getMetaInfluencedRenewals(DEFAULT_WINDOW),
      getMetaAcquisitionByPlan(DEFAULT_WINDOW),
    ]);
    initialData = {
      analytics,
      sourcePerformance: source.rows,
      sourcePerformanceOfflineMeta: source.offlineMetaEnrollments,
      sourcePerformanceWindow: source.window,
      campaignPerformance: campaigns.rows,
      campaignPerformanceWindow: campaigns.window,
      adPerformance: ads.rows,
      adPerformanceWindow: ads.window,
      metaRenewals: renewals.rows,
      metaRenewalsWindow: renewals.window,
      metaAcquisitionByPlan: acquisition.rows,
      metaAcquisitionByPlanWindow: acquisition.window,
    };
  } catch {
    analyticsError = 'Dashboard metrics could not be loaded. Check that the backend is running the latest version.';
  }

  return <DashboardPageClient initialData={initialData} initialError={analyticsError} />;
}
