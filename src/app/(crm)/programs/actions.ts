'use server';

import { revalidatePath } from 'next/cache';
import { patchCohort, transferEnrollment, type PatchCohortInput } from '@/utils/api';

export async function patchCohortAction(cohortId: string, input: PatchCohortInput) {
  const result = await patchCohort(cohortId, input);
  revalidatePath('/programs');
  revalidatePath(`/programs/cohorts/${cohortId}`);
  return result;
}

export async function transferEnrollmentAction(cohortId: string, enrollmentId: string, targetCohortId: string) {
  await transferEnrollment(enrollmentId, targetCohortId);
  revalidatePath(`/programs/cohorts/${cohortId}`);
  revalidatePath(`/programs/cohorts/${targetCohortId}`);
  revalidatePath('/programs');
}
