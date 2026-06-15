'use server';

import type { ContactOutcome } from '@/types/crm';
import { ApiError, createLeadContactEvent, markLeadLost } from '@/utils/api';

export async function logLeadCall(
  leadId: string,
  input: { outcome: ContactOutcome; notes?: string }
): Promise<{ error: string | null; suggestMarkLost: boolean }> {
  try {
    await createLeadContactEvent(leadId, input);
    const suggestMarkLost = input.outcome === 'not_interested' || input.outcome === 'wrong_number';
    return { error: null, suggestMarkLost };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to log call.';
    return { error: message, suggestMarkLost: false };
  }
}

export async function markLeadAsLost(leadId: string, reason?: string): Promise<{ error: string | null }> {
  try {
    await markLeadLost(leadId, reason);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to mark lead as lost.';
    return { error: message };
  }
}
