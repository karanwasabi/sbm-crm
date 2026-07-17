'use server';

import { revalidatePath } from 'next/cache';
import {
  assignCohortCoach,
  patchCohort,
  patchCohortPointAEnabled,
  transferEnrollment,
  type PatchCohortInput,
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
