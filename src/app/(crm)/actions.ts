'use server';

import type { AdPerformanceRow, MetaCampaignPerformanceRow, SourcePerformanceRow } from '@/types/crm';
import { getAdPerformance, getMetaCampaignPerformance, getSourcePerformance } from '@/utils/api';

export async function fetchSourcePerformance(
  days: number | 'all'
): Promise<{ ok: true; rows: SourcePerformanceRow[] } | { ok: false; error: string }> {
  try {
    const rows = await getSourcePerformance(days);
    return { ok: true, rows };
  } catch {
    return { ok: false, error: 'Failed to load source performance.' };
  }
}

export async function fetchMetaCampaignPerformance(
  days: number | 'all'
): Promise<{ ok: true; rows: MetaCampaignPerformanceRow[] } | { ok: false; error: string }> {
  try {
    const rows = await getMetaCampaignPerformance(days);
    return { ok: true, rows };
  } catch {
    return { ok: false, error: 'Failed to load campaign performance.' };
  }
}

export async function fetchAdPerformance(
  days: number | 'all'
): Promise<{ ok: true; rows: AdPerformanceRow[] } | { ok: false; error: string }> {
  try {
    const rows = await getAdPerformance(days);
    return { ok: true, rows };
  } catch {
    return { ok: false, error: 'Failed to load ad performance.' };
  }
}
