'use server';

import type { ContactOutcome } from '@/types/crm';
import { contactOutcomeMarksLost } from '@/types/crm';
import { ApiError, createLeadContactEvent, markLeadLost, sendLeadEmail } from '@/utils/api';

export async function logLeadCall(
  leadId: string,
  input: { outcome: ContactOutcome; notes?: string }
): Promise<{ error: string | null }> {
  try {
    await createLeadContactEvent(leadId, input);
    if (contactOutcomeMarksLost(input.outcome)) {
      await markLeadLost(leadId, input.outcome);
    }
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to log call.';
    return { error: message };
  }
}

export async function sendLeadEmailAction(leadId: string, templateId: string): Promise<void> {
  await sendLeadEmail(leadId, templateId);
}
