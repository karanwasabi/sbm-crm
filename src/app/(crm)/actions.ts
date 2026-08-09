'use server';

import type {
  AdPerformanceRow,
  MetaCampaignPerformanceRow,
  PerformanceReportMeta,
  SourcePerformanceRow,
} from '@/types/crm';
import { getAdPerformance, getMetaCampaignPerformance, getSourcePerformance } from '@/utils/api';

export async function fetchSourcePerformance(
  days: number | 'all'
): Promise<{ ok: true; rows: SourcePerformanceRow[]; window: PerformanceReportMeta } | { ok: false; error: string }> {
  try {
    const result = await getSourcePerformance(days);
    return { ok: true, rows: result.rows, window: result.window };
  } catch {
    return { ok: false, error: 'Failed to load source performance.' };
  }
}

export async function fetchMetaCampaignPerformance(
  days: number | 'all'
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
  days: number | 'all'
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
    return { summary: null, error: null };
  }
}
