import type { ManualLeadSource } from '@/types/crm';
import { MANUAL_LEAD_SOURCE_OPTIONS } from '@/types/crm';
import { validateOptionalPhoneNumber } from '@/lib/whatsapp-validation';

export type LeadFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  city: string;
  manualSource: ManualLeadSource | '';
  notes: string;
  manualTags: string[];
  dpdpConsent: boolean;
};

function validatePhone(phone: string): string | null {
  return validateOptionalPhoneNumber(phone);
}

export function buildLeadPayload(
  values: LeadFormValues
): { ok: true; payload: import('@/types/crm').CreateLeadInput } | { ok: false; error: string } {
  const firstName = values.firstName.trim();
  const email = values.email.trim().toLowerCase();

  if (!firstName) {
    return { ok: false, error: 'First name is required.' };
  }
  if (!email) {
    return { ok: false, error: 'Email is required.' };
  }
  if (!values.dpdpConsent) {
    return { ok: false, error: 'DPDP consent is required before saving.' };
  }
  if (!values.manualSource) {
    return { ok: false, error: 'Source is required.' };
  }

  const phone = values.phone.trim();
  if (phone) {
    const phoneError = validatePhone(phone);
    if (phoneError) {
      return { ok: false, error: phoneError };
    }
  }

  const lastName = values.lastName.trim();
  const countryCode = values.countryCode.trim().toUpperCase();
  const city = values.city.trim();
  const notes = values.notes.trim();

  return {
    ok: true,
    payload: {
      first_name: firstName,
      ...(lastName ? { last_name: lastName } : {}),
      email,
      ...(phone ? { phone } : {}),
      ...(countryCode ? { country_code: countryCode } : {}),
      ...(city ? { city } : {}),
      manual_source: values.manualSource,
      ...(notes ? { notes } : {}),
      ...(values.manualTags.length > 0 ? { manual_tags: values.manualTags } : {}),
      dpdp_consent: true,
    },
  };
}

export function isManualLeadSource(value: string): value is ManualLeadSource {
  return MANUAL_LEAD_SOURCE_OPTIONS.some((option) => option.value === value);
}
