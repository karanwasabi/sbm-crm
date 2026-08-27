'use server';

import type {
  AdPerformanceRow,
  DashboardAnalytics,
  MetaCampaignPerformanceRow,
  OfflineMetaEnrollmentsSummary,
  PerformanceReportMeta,
  SourcePerformanceRow,
} from '@/types/crm';
import type { PerformanceWindowPreset } from '@/lib/performance-display';
import { getAdPerformance, getDashboardAnalytics, getMetaCampaignPerformance, getSourcePerformance } from '@/utils/api';

export type DashboardPageData = {
  analytics: DashboardAnalytics;
  sourcePerformance: SourcePerformanceRow[];
  sourcePerformanceOfflineMeta: OfflineMetaEnrollmentsSummary | null;
  sourcePerformanceWindow: PerformanceReportMeta | null;
  campaignPerformance: MetaCampaignPerformanceRow[];
  campaignPerformanceWindow: PerformanceReportMeta | null;
  adPerformance: AdPerformanceRow[];
  adPerformanceWindow: PerformanceReportMeta | null;
};

export async function fetchDashboardPageData(
  days: PerformanceWindowPreset
): Promise<{ ok: true; data: DashboardPageData } | { ok: false; error: string }> {
  try {
    const [analytics, source, campaigns, ads] = await Promise.all([
      getDashboardAnalytics(days),
      getSourcePerformance(days),
      getMetaCampaignPerformance(days),
      getAdPerformance(days),
    ]);
    return {
      ok: true,
      data: {
        analytics,
        sourcePerformance: source.rows,
        sourcePerformanceOfflineMeta: source.offlineMetaEnrollments,
        sourcePerformanceWindow: source.window,
        campaignPerformance: campaigns.rows,
        campaignPerformanceWindow: campaigns.window,
        adPerformance: ads.rows,
        adPerformanceWindow: ads.window,
      },
    };
  } catch {
    return { ok: false, error: 'Failed to load dashboard data.' };
  }
}

export async function fetchSourcePerformance(days: PerformanceWindowPreset): Promise<
  | {
      ok: true;
      rows: SourcePerformanceRow[];
      window: PerformanceReportMeta;
      offlineMetaEnrollments: OfflineMetaEnrollmentsSummary | null;
    }
  | { ok: false; error: string }
> {
  try {
    const result = await getSourcePerformance(days);
    return {
      ok: true,
      rows: result.rows,
      window: result.window,
      offlineMetaEnrollments: result.offlineMetaEnrollments,
    };
  } catch {
    return { ok: false, error: 'Failed to load source performance.' };
  }
}

export async function fetchMetaCampaignPerformance(
  days: PerformanceWindowPreset
): Promise<
  { ok: true; rows: MetaCampaignPerformanceRow[]; window: PerformanceReportMeta } | { ok: false; error: string }
> {
  try {
    const result = await getMetaCampaignPerformance(days);
    return { ok: true, rows: result.rows, window: result.window };
  } catch {
    return { ok: false, error: 'Failed to load campaign performance.' };
  }
}

export async function fetchAdPerformance(
  days: PerformanceWindowPreset
): Promise<{ ok: true; rows: AdPerformanceRow[]; window: PerformanceReportMeta } | { ok: false; error: string }> {
  try {
    const result = await getAdPerformance(days);
    return { ok: true, rows: result.rows, window: result.window };
  } catch {
    return { ok: false, error: 'Failed to load ad performance.' };
  }
}

export async function getWhatsAppUnreadSummaryAction(): Promise<{
  summary: import('@/utils/api').WhatsAppUnreadSummary | null;
  error: string | null;
}> {
  try {
    const { getWhatsAppUnreadSummary } = await import('@/utils/api');
    const summary = await getWhatsAppUnreadSummary();
    return { summary, error: null };
  } catch {
    return { summary: null, error: 'Failed to load WhatsApp unread summary.' };
  }
}
