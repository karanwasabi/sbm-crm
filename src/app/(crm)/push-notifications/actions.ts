'use server';

import { revalidatePath } from 'next/cache';
import type { PushTemplateEntry, PushTemplateStatus } from '@/utils/api';
import {
  addPushTemplateWeek,
  createPushTemplate,
  deletePushTemplate,
  getPushTemplate,
  listCohortPushAssignments,
  listPushTemplates,
  patchCohortPushTemplate,
  patchPushTemplate,
  putPushTemplateEntries,
  removePushTemplateLastWeek,
} from '@/utils/api';

export async function listPushTemplatesAction() {
  return listPushTemplates();
}

export async function getPushTemplateAction(id: string) {
  return getPushTemplate(id);
}

export async function createPushTemplateAction(name: string) {
  const result = await createPushTemplate(name);
  revalidatePath('/push-notifications');
  return result;
}

export async function patchPushTemplateAction(id: string, input: { name?: string; status?: PushTemplateStatus }) {
  const result = await patchPushTemplate(id, input);
  revalidatePath('/push-notifications');
  revalidatePath(`/push-notifications/${id}`);
  return result;
}

export async function deletePushTemplateAction(id: string) {
  await deletePushTemplate(id);
  revalidatePath('/push-notifications');
}

export async function putPushTemplateEntriesAction(id: string, entries: PushTemplateEntry[]) {
  const result = await putPushTemplateEntries(id, entries);
  revalidatePath(`/push-notifications/${id}`);
  return result;
}

export async function addPushTemplateWeekAction(id: string) {
  const result = await addPushTemplateWeek(id);
  revalidatePath(`/push-notifications/${id}`);
  return result;
}

export async function removePushTemplateLastWeekAction(id: string) {
  const result = await removePushTemplateLastWeek(id);
  revalidatePath(`/push-notifications/${id}`);
  return result;
}

export async function listCohortPushAssignmentsAction() {
  return listCohortPushAssignments();
}

export async function patchCohortPushTemplateAction(cohortId: string, templateId: string | null) {
  await patchCohortPushTemplate(cohortId, templateId);
  revalidatePath('/push-notifications');
}
