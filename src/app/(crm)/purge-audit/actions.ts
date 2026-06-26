'use server';

import { ApiError, getPurgeAuditEvent } from '@/utils/api';
import type { PurgeAuditDetail } from '@/utils/api';

export async function getPurgeAuditEventAction(
  id: string
): Promise<{ detail: PurgeAuditDetail | null; error: string | null }> {
  try {
    const detail = await getPurgeAuditEvent(id);
    return { detail, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load purge event.';
    return { detail: null, error: message };
  }
}
