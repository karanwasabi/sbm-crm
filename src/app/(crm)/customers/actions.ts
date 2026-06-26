'use server';

import type { ContactOutcome } from '@/types/crm';
import { contactOutcomeMarksLost } from '@/types/crm';
import {
  ApiError,
  createLeadContactEvent,
  getLeadPurgePreview,
  markLeadLost,
  purgeLead,
  sendLeadEmail,
  updateLeadTags,
} from '@/utils/api';
import type { LeadPurgeInput, LeadPurgePreview } from '@/utils/api';

export async function updateLeadTagsAction(leadId: string, manualTags: string[]): Promise<{ error: string | null }> {
  try {
    await updateLeadTags(leadId, manualTags);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to update tags.';
    return { error: message };
  }
}

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

export async function getLeadPurgePreviewAction(
  leadId: string
): Promise<{ preview: LeadPurgePreview | null; error: string | null }> {
  try {
    const preview = await getLeadPurgePreview(leadId);
    return { preview, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load purge preview.';
    return { preview: null, error: message };
  }
}

export async function purgeLeadAction(leadId: string, input: LeadPurgeInput): Promise<{ error: string | null }> {
  try {
    await purgeLead(leadId, input);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to purge account.';
    return { error: message };
  }
}
