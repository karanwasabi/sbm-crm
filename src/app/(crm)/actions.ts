'use server';

import type { MetaCampaignPerformanceRow, SourcePerformanceRow } from '@/types/crm';
import { getMetaCampaignPerformance, getSourcePerformance } from '@/utils/api';

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
