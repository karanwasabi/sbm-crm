import { validateDateOfBirth } from '@/lib/date-of-birth';
import { normalizeProfileTimezoneForDb } from '@/lib/profile-timezone';
import type { MealPreference, ProfilePatch, Sex } from '@/types/profile';

export type ProfileFormValues = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  timezoneId: string;
  countryCode: string;
  city: string;
  mealPreference: string;
  whatsapp: string;
  parentalConsent: boolean;
};

export type ProfileFormParseResult = { ok: true; patch: ProfilePatch } | { ok: false; error: string };

export type ProfileFormParseOptions = {
  /** When true, all registration-required fields must be present. */
  requireAll?: boolean;
};

function valuesFromFormData(formData: FormData): ProfileFormValues {
  return {
    firstName: String(formData.get('firstName') ?? '').trim(),
    lastName: String(formData.get('lastName') ?? '').trim(),
    dateOfBirth: String(formData.get('dateOfBirth') ?? '').trim(),
    sex: String(formData.get('sex') ?? '').trim(),
    timezoneId: String(formData.get('timezoneId') ?? '').trim(),
    countryCode: String(formData.get('countryCode') ?? '')
      .trim()
      .toUpperCase(),
    city: String(formData.get('city') ?? '').trim(),
    mealPreference: String(formData.get('mealPreference') ?? '').trim(),
    whatsapp: String(formData.get('whatsapp') ?? '').trim(),
    parentalConsent: formData.get('parentalConsent') === 'true',
  };
}

export function buildProfilePatch(formData: FormData, options: ProfileFormParseOptions = {}): ProfileFormParseResult {
  const values = valuesFromFormData(formData);
  const { requireAll = false } = options;

  if (requireAll) {
    if (!values.firstName) return { ok: false, error: 'First name is required.' };
    if (!values.dateOfBirth) return { ok: false, error: 'Date of birth is required.' };
    if (!values.sex) return { ok: false, error: 'Please select your sex.' };
    if (!values.countryCode) return { ok: false, error: 'Country is required.' };
    if (!values.timezoneId) return { ok: false, error: 'Timezone is required.' };
    if (!values.mealPreference) return { ok: false, error: 'Meal preference is required.' };
  }

  const patch: ProfilePatch = {};

  if (values.firstName) patch.first_name = values.firstName;
  if (values.lastName) patch.last_name = values.lastName;
  if (values.dateOfBirth) {
    const dobError = validateDateOfBirth(values.dateOfBirth, values.parentalConsent);
    if (dobError) {
      return { ok: false, error: dobError };
    }
    patch.date_of_birth = values.dateOfBirth;
    patch.parental_consent = values.parentalConsent;
  } else if (requireAll) {
    return { ok: false, error: 'Date of birth is required.' };
  }
  if (values.sex) patch.sex = values.sex as Sex;
  if (values.countryCode) patch.country_code = values.countryCode;
  if (values.city) patch.city = values.city;
  if (values.mealPreference) patch.meal_preference = values.mealPreference as MealPreference;
  patch.whatsapp = values.whatsapp;

  if (values.timezoneId) {
    const canonical = normalizeProfileTimezoneForDb(values.timezoneId);
    if (!canonical) {
      return { ok: false, error: 'Please choose a valid timezone.' };
    }
    patch.timezone_id = canonical;
  } else if (requireAll) {
    return { ok: false, error: 'Timezone is required.' };
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No changes to save.' };
  }

  return { ok: true, patch };
}
