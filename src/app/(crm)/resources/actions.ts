'use server';

import { revalidatePath } from 'next/cache';
import type {
  CohortResourceAssignmentInput,
  CohortResourceCategoryInput,
  CreateAdminResourceInput,
  PatchAdminResourceInput,
  ResourceCategory,
} from '@/utils/api';
import {
  createAdminResource,
  createResourceUploadUrl,
  deleteAdminResource,
  getCohortResourceCategories,
  getCohortResources,
  listAdminResources,
  patchAdminResource,
  putCohortResourceCategories,
  putCohortResources,
} from '@/utils/api';

export async function listAdminResourcesAction(category?: ResourceCategory) {
  return listAdminResources(category);
}

export async function createAdminResourceAction(input: CreateAdminResourceInput) {
  const result = await createAdminResource(input);
  revalidatePath('/resources');
  return result;
}

export async function patchAdminResourceAction(id: string, input: PatchAdminResourceInput) {
  const result = await patchAdminResource(id, input);
  revalidatePath('/resources');
  return result;
}

export async function deleteAdminResourceAction(id: string) {
  await deleteAdminResource(id);
  revalidatePath('/resources');
}

export async function createResourceUploadUrlAction(filename: string) {
  return createResourceUploadUrl(filename);
}

export async function getCohortResourcesAction(cohortId: string) {
  return getCohortResources(cohortId);
}

export async function putCohortResourcesAction(cohortId: string, assignments: CohortResourceAssignmentInput[]) {
  const result = await putCohortResources(cohortId, assignments);
  revalidatePath('/resources');
  return result;
}

export async function getCohortResourceCategoriesAction(cohortId: string) {
  return getCohortResourceCategories(cohortId);
}

export async function putCohortResourceCategoriesAction(cohortId: string, categories: CohortResourceCategoryInput[]) {
  const result = await putCohortResourceCategories(cohortId, categories);
  revalidatePath('/resources');
  return result;
}
