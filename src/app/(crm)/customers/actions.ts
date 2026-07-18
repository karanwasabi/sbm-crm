'use server';

import type { ContactOutcome } from '@/types/crm';
import { contactOutcomeMarksLost } from '@/types/crm';
import {
  ApiError,
  applyLeadFieldSuggestion as applyLeadFieldSuggestionApi,
  applyManualIntakeSnapshot as applyManualIntakeSnapshotApi,
  applyManualIntakeSubmitted as applyManualIntakeSubmittedApi,
  createLeadContactEvent,
  dismissLeadContactDuplicate,
  dismissLeadFieldSuggestion as dismissLeadFieldSuggestionApi,
  getLeadPurgePreview,
  markLeadFieldSuggestionsSeen as markLeadFieldSuggestionsSeenApi,
  markLeadLost,
  purgeLead,
  sendLeadEmail,
  updateLeadTags,
  offlineEnrollLead,
  listOfflineEnrollCohorts,
  syncLeadCheckout,
  markLeadCheckoutPaidOffline,
  setLeadPassword,
  verifyLeadEmail,
  setLeadMembershipAccessUntil,
  setLeadMemberKind,
  promoteLeadToMember,
} from '@/utils/api';
import type {
  LeadPurgeInput,
  LeadPurgePreview,
  LeadCheckoutSyncResult,
  MarkCheckoutPaidOfflineResult,
  SetLeadPasswordResult,
  VerifyLeadEmailResult,
  SetMembershipAccessResult,
  SetMemberKindResult,
  PromoteToMemberResult,
} from '@/utils/api';
import type { OfflineEnrollCohort } from '@/types/crm';

export async function updateLeadTagsAction(leadId: string, manualTags: string[]): Promise<{ error: string | null }> {
  try {
    await updateLeadTags(leadId, manualTags);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to update tags.';
    return { error: message };
  }
}

export async function dismissLeadContactDuplicateAction(
  leadId: string,
  linkId: number
): Promise<{ error: string | null }> {
  try {
    await dismissLeadContactDuplicate(leadId, linkId);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to dismiss duplicate.';
    return { error: message };
  }
}

export async function applyLeadFieldSuggestion(
  leadId: string,
  suggestionId: number
): Promise<{ error: string | null }> {
  try {
    await applyLeadFieldSuggestionApi(leadId, suggestionId);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to apply suggestion.';
    return { error: message };
  }
}

export async function applyManualIntakeSnapshot(
  leadId: string,
  eventId: number,
  field: 'name' | 'phone' | 'city' | 'country'
): Promise<{ error: string | null }> {
  try {
    await applyManualIntakeSnapshotApi(leadId, eventId, field);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to apply profile value.';
    return { error: message };
  }
}

export async function applyManualIntakeSubmitted(
  leadId: string,
  eventId: number,
  field: 'name' | 'phone' | 'city' | 'country'
): Promise<{ error: string | null }> {
  try {
    await applyManualIntakeSubmittedApi(leadId, eventId, field);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to apply inquiry value.';
    return { error: message };
  }
}

export async function dismissLeadFieldSuggestion(
  leadId: string,
  suggestionId: number
): Promise<{ error: string | null }> {
  try {
    await dismissLeadFieldSuggestionApi(leadId, suggestionId);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to dismiss suggestion.';
    return { error: message };
  }
}

export async function markLeadFieldSuggestionsSeen(leadId: string): Promise<{ error: string | null }> {
  try {
    await markLeadFieldSuggestionsSeenApi(leadId);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to mark suggestions seen.';
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

export async function offlineEnrollLeadAction(leadId: string, cohortId: string): Promise<{ error: string | null }> {
  try {
    await offlineEnrollLead(leadId, cohortId);
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to enroll lead.';
    return { error: message };
  }
}

export async function listOfflineEnrollCohortsAction(): Promise<{
  cohorts: OfflineEnrollCohort[] | null;
  error: string | null;
}> {
  try {
    const cohorts = await listOfflineEnrollCohorts();
    return { cohorts, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load cohorts.';
    return { cohorts: null, error: message };
  }
}

export async function syncLeadCheckoutAction(
  leadId: string
): Promise<{ result: LeadCheckoutSyncResult | null; error: string | null }> {
  try {
    const result = await syncLeadCheckout(leadId);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to sync checkout payment.';
    return { result: null, error: message };
  }
}

export async function markLeadCheckoutPaidOfflineAction(
  leadId: string
): Promise<{ result: MarkCheckoutPaidOfflineResult | null; error: string | null }> {
  try {
    const result = await markLeadCheckoutPaidOffline(leadId);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to mark checkout paid offline.';
    return { result: null, error: message };
  }
}

export async function setLeadPasswordAction(
  leadId: string,
  password: string
): Promise<{ result: SetLeadPasswordResult | null; error: string | null }> {
  try {
    const result = await setLeadPassword(leadId, password);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to set password.';
    return { result: null, error: message };
  }
}

export async function verifyLeadEmailAction(
  leadId: string
): Promise<{ result: VerifyLeadEmailResult | null; error: string | null }> {
  try {
    const result = await verifyLeadEmail(leadId);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to verify email.';
    return { result: null, error: message };
  }
}

export async function setLeadMembershipAccessUntilAction(
  leadId: string,
  enrollmentId: string,
  accessUntil: string
): Promise<{ result: SetMembershipAccessResult | null; error: string | null }> {
  try {
    const result = await setLeadMembershipAccessUntil(leadId, enrollmentId, accessUntil);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to update membership access.';
    return { result: null, error: message };
  }
}

export async function setLeadMemberKindAction(
  leadId: string,
  memberKind: 'renewal' | 'returnee' | null
): Promise<{ result: SetMemberKindResult | null; error: string | null }> {
  try {
    const result = await setLeadMemberKind(leadId, memberKind);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to update member kind.';
    return { result: null, error: message };
  }
}

export async function promoteLeadToMemberAction(
  leadId: string,
  enrollmentId: string
): Promise<{ result: PromoteToMemberResult | null; error: string | null }> {
  try {
    const result = await promoteLeadToMember(leadId, enrollmentId);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to promote to member.';
    return { result: null, error: message };
  }
}
