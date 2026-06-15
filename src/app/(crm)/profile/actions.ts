'use server';

import { buildProfilePatch } from '@/lib/profile-form';
import type { UpdateProfileState } from '@/types/profile';
import type { CountryCity } from '@/types/reference';
import { ApiError, fetchCountryCities, patchProfile } from '@/utils/api';

export async function loadCountryCities(countryCode: string): Promise<CountryCity[]> {
  if (!countryCode) return [];
  try {
    return await fetchCountryCities(countryCode);
  } catch {
    return [];
  }
}

export async function updateProfile(_prevState: UpdateProfileState, formData: FormData): Promise<UpdateProfileState> {
  const result = buildProfilePatch(formData);
  if (!result.ok) {
    return { error: result.error, success: false };
  }

  try {
    await patchProfile(result.patch);
    return { error: null, success: true };
  } catch (error) {
    const message = error instanceof ApiError ? error.message : 'Failed to save profile.';
    return { error: message, success: false };
  }
}
