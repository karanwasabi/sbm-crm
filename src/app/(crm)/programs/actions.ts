'use server';

import { revalidatePath } from 'next/cache';
import {
  archiveCohort,
  assignCohortCoach,
  deleteCohort,
  lockCohort,
  patchCohort,
  patchCohortIsDemo,
  patchCohortPointAEnabled,
  sendCohortPushBroadcast,
  getCohortPushBroadcastPreview,
  transferEnrollment,
  type PatchCohortInput,
  type CohortPushBroadcastPreview,
  type CohortPushBroadcastResult,
  ApiError,
} from '@/utils/api';

export async function patchCohortAction(cohortId: string, input: PatchCohortInput) {
  const result = await patchCohort(cohortId, input);
  revalidatePath('/programs');
  revalidatePath(`/programs/cohorts/${cohortId}`);
  return result;
}

export async function patchCohortPointAEnabledAction(cohortId: string, pointAEnabled: boolean) {
  const result = await patchCohortPointAEnabled(cohortId, pointAEnabled);
  revalidatePath(`/programs/cohorts/${cohortId}`);
  revalidatePath('/programs');
  return result;
}

export async function patchCohortIsDemoAction(cohortId: string, isDemo: boolean) {
  const result = await patchCohortIsDemo(cohortId, isDemo);
  revalidatePath(`/programs/cohorts/${cohortId}`);
  revalidatePath('/programs');
  return result;
}

export async function lockCohortAction(
  cohortId: string
): Promise<{ result: { id: string; status: string; name: string } | null; error: string | null }> {
  try {
    const result = await lockCohort(cohortId);
    revalidatePath('/programs');
    revalidatePath(`/programs/cohorts/${cohortId}`);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to lock cohort.';
    return { result: null, error: message };
  }
}

export async function archiveCohortAction(cohortId: string): Promise<{ error: string | null }> {
  try {
    await archiveCohort(cohortId);
    revalidatePath('/programs');
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to archive cohort.';
    return { error: message };
  }
}

export async function deleteCohortAction(cohortId: string): Promise<{ error: string | null }> {
  try {
    await deleteCohort(cohortId);
    revalidatePath('/programs');
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to delete cohort.';
    return { error: message };
  }
}

export async function transferEnrollmentAction(
  cohortId: string,
  enrollmentId: string,
  targetCohortId: string
): Promise<{ error: string | null }> {
  try {
    await transferEnrollment(enrollmentId, targetCohortId);
    revalidatePath(`/programs/cohorts/${cohortId}`);
    revalidatePath(`/programs/cohorts/${targetCohortId}`);
    revalidatePath('/programs');
    return { error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to transfer member.';
    return { error: message };
  }
}

export async function assignCohortCoachAction(cohortId: string, enrollmentIds: string[], coachUserId: string | null) {
  const result = await assignCohortCoach(cohortId, {
    enrollment_ids: enrollmentIds,
    coach_user_id: coachUserId,
  });
  revalidatePath(`/programs/cohorts/${cohortId}`);
  return result;
}

export async function getCohortPushBroadcastPreviewAction(
  cohortId: string
): Promise<{ preview: CohortPushBroadcastPreview | null; error: string | null }> {
  try {
    const preview = await getCohortPushBroadcastPreview(cohortId);
    return { preview, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to load push broadcast preview.';
    return { preview: null, error: message };
  }
}

export async function sendCohortPushBroadcastAction(
  cohortId: string,
  input: { title: string; body: string }
): Promise<{ result: CohortPushBroadcastResult | null; error: string | null }> {
  try {
    const result = await sendCohortPushBroadcast(cohortId, input);
    return { result, error: null };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to send push broadcast.';
    return { result: null, error: message };
  }
}
