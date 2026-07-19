'use server';

import { revalidatePath } from 'next/cache';
import {
  assignCohortCoach,
  lockCohort,
  patchCohort,
  patchCohortIsDemo,
  patchCohortPointAEnabled,
  transferEnrollment,
  type PatchCohortInput,
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

export async function transferEnrollmentAction(cohortId: string, enrollmentId: string, targetCohortId: string) {
  await transferEnrollment(enrollmentId, targetCohortId);
  revalidatePath(`/programs/cohorts/${cohortId}`);
  revalidatePath(`/programs/cohorts/${targetCohortId}`);
  revalidatePath('/programs');
}

export async function assignCohortCoachAction(cohortId: string, enrollmentIds: string[], coachUserId: string | null) {
  const result = await assignCohortCoach(cohortId, {
    enrollment_ids: enrollmentIds,
    coach_user_id: coachUserId,
  });
  revalidatePath(`/programs/cohorts/${cohortId}`);
  return result;
}
