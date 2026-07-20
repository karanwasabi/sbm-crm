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
  previewMembershipTransfer,
  applyMembershipTransfer,
  syncLeadCheckout,
  markLeadCheckoutPaidOffline,
  setLeadPassword,
  verifyLeadEmail,
  getLeadMemberProfile,
  forceLeadNutritionRecalc,
  putLeadServingAddons,
  correctLeadWeights,
  correctLeadHeight,
  getLeadPointA,
  putLeadPointA,
  resetLeadOnboardingPointA,
  setLeadMembershipAccessUntil,
  setLeadMemberKind,
  promoteLeadToMember,
  demoteLeadToNewbie,
} from '@/utils/api';
import type {
  LeadPurgeInput,
  LeadPurgePreview,
  LeadCheckoutSyncResult,
  MarkCheckoutPaidOfflineResult,
  SetLeadPasswordResult,
  VerifyLeadEmailResult,
  MemberProfile,
  NutritionRecalcResult,
  CorrectHeightResult,
  ServingAddons,
  ServingAddonsResult,
  PointAAssessment,
  PutPointAAssessmentInput,
  ResetOnboardingPointAResult,
  SetMembershipAccessResult,
  SetMemberKindResult,
  PromoteToMemberResult,
  DemoteToNewbieResult,
} from '@/utils/api';
import type {
  OfflineEnrollCohort,
  MembershipTransferPreviewRequest,
  MembershipTransferApplyRequest,
  MembershipTransferPreviewResponse,
  MembershipTransferApplyResult,
} from '@/types/crm';

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

export async function previewMembershipTransferAction(
  leadId: string,
  body: MembershipTransferPreviewRequest
): Promise<{ preview: MembershipTransferPreviewResponse | null; error: string | null }> {
  try {
    const preview = await previewMembershipTransfer(leadId, body);
    return { preview, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to preview membership transfer.';
    return { preview: null, error: message };
  }
}

export async function applyMembershipTransferAction(
  leadId: string,
  body: MembershipTransferApplyRequest
): Promise<{ result: MembershipTransferApplyResult | null; error: string | null }> {
  try {
    const result = await applyMembershipTransfer(leadId, body);
    if (result.status === 'failed') {
      return {
        result,
        error: result.error ?? 'Membership transfer failed.',
      };
    }
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to transfer membership.';
    return { result: null, error: message };
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

export async function getLeadMemberProfileAction(
  leadId: string
): Promise<{ result: MemberProfile | null; error: string | null }> {
  try {
    const result = await getLeadMemberProfile(leadId);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load member profile.';
    return { result: null, error: message };
  }
}

export async function forceLeadNutritionRecalcAction(
  leadId: string
): Promise<{ result: NutritionRecalcResult | null; error: string | null }> {
  try {
    const result = await forceLeadNutritionRecalc(leadId);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to recalculate nutrition.';
    return { result: null, error: message };
  }
}

export async function putLeadServingAddonsAction(
  leadId: string,
  addons: ServingAddons
): Promise<{ result: ServingAddonsResult | null; error: string | null }> {
  try {
    const result = await putLeadServingAddons(leadId, addons);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to save serving addons.';
    return { result: null, error: message };
  }
}

export async function correctLeadWeightsAction(
  leadId: string,
  initialWeightKg: number,
  currentWeightKg: number
): Promise<{ result: NutritionRecalcResult | null; error: string | null }> {
  try {
    const result = await correctLeadWeights(leadId, initialWeightKg, currentWeightKg);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to correct weights.';
    return { result: null, error: message };
  }
}

export async function correctLeadHeightAction(
  leadId: string,
  heightCm: number
): Promise<{ result: CorrectHeightResult | null; error: string | null }> {
  try {
    const result = await correctLeadHeight(leadId, heightCm);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to correct height.';
    return { result: null, error: message };
  }
}

export async function resetLeadOnboardingPointAAction(
  leadId: string
): Promise<{ result: ResetOnboardingPointAResult | null; error: string | null }> {
  try {
    const result = await resetLeadOnboardingPointA(leadId);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to reset onboarding and Point A.';
    return { result: null, error: message };
  }
}

export async function getLeadPointAAction(
  leadId: string
): Promise<{ result: PointAAssessment | null; error: string | null }> {
  try {
    const result = await getLeadPointA(leadId);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load Point A assessment.';
    return { result: null, error: message };
  }
}

export async function putLeadPointAAction(
  leadId: string,
  input: PutPointAAssessmentInput
): Promise<{ result: PointAAssessment | null; error: string | null }> {
  try {
    const result = await putLeadPointA(leadId, input);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to save Point A assessment.';
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

export async function demoteLeadToNewbieAction(
  leadId: string,
  enrollmentId: string
): Promise<{ result: DemoteToNewbieResult | null; error: string | null }> {
  try {
    const result = await demoteLeadToNewbie(leadId, enrollmentId);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to demote to newbie.';
    return { result: null, error: message };
  }
}
