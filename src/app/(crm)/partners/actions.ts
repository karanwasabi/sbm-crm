'use server';

import { revalidatePath } from 'next/cache';
import {
  activatePartnerAPIClient,
  createPartnerAPIClient,
  deactivatePartnerAPIClient,
  listPartnerAPIClients,
  patchPartnerAPIClient,
  rotatePartnerAPIClientKey,
  rotatePartnerWebhookSecret,
  type CreatePartnerAPIClientInput,
  type PatchPartnerAPIClientInput,
} from '@/utils/api';

export async function listPartnerAPIClientsAction() {
  return listPartnerAPIClients();
}

export async function createPartnerAPIClientAction(input: CreatePartnerAPIClientInput) {
  const result = await createPartnerAPIClient(input);
  revalidatePath('/partners');
  return result;
}

export async function patchPartnerAPIClientAction(id: string, input: PatchPartnerAPIClientInput) {
  const result = await patchPartnerAPIClient(id, input);
  revalidatePath('/partners');
  return result;
}

export async function activatePartnerAPIClientAction(id: string) {
  const result = await activatePartnerAPIClient(id);
  revalidatePath('/partners');
  return result;
}

export async function deactivatePartnerAPIClientAction(id: string) {
  const result = await deactivatePartnerAPIClient(id);
  revalidatePath('/partners');
  return result;
}

export async function rotatePartnerAPIClientKeyAction(id: string) {
  const result = await rotatePartnerAPIClientKey(id);
  revalidatePath('/partners');
  return result;
}

export async function rotatePartnerWebhookSecretAction(id: string) {
  const result = await rotatePartnerWebhookSecret(id);
  revalidatePath('/partners');
  return result;
}
