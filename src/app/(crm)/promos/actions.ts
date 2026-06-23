'use server';

import { revalidatePath } from 'next/cache';
import type { CreatePromoInput, PromoTermInput } from '@/utils/api';
import {
  createPromoCode,
  createPromoTerm,
  deactivatePromoCode,
  deletePromoCode,
  updatePromoDescription,
} from '@/utils/api';

export async function createPromoAction(input: CreatePromoInput) {
  const result = await createPromoCode(input);
  revalidatePath('/promos');
  return result;
}

export async function createPromoTermAction(promoId: string, input: PromoTermInput) {
  const result = await createPromoTerm(promoId, input);
  revalidatePath(`/promos/${promoId}`);
  revalidatePath('/promos');
  return result;
}

export async function deactivatePromoAction(promoId: string) {
  const result = await deactivatePromoCode(promoId);
  revalidatePath(`/promos/${promoId}`);
  revalidatePath('/promos');
  return result;
}

export async function deletePromoAction(promoId: string) {
  await deletePromoCode(promoId);
  revalidatePath('/promos');
}

export async function updatePromoDescriptionAction(promoId: string, description: string | null) {
  const result = await updatePromoDescription(promoId, description);
  revalidatePath(`/promos/${promoId}`);
  revalidatePath('/promos');
  return result;
}
