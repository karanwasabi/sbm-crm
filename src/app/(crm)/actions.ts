'use server';

import type { SourcePerformanceRow } from '@/types/crm';
import { getSourcePerformance } from '@/utils/api';

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
