import { validateMobileNational } from '@/lib/country-mobile-rules';
import { parseWhatsapp } from '@/lib/phone-number';

export function validateWhatsappNumber(value: string, preferredDialIso?: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'WhatsApp number is required.';

  const parsed = parseWhatsapp(trimmed, preferredDialIso);
  if (!parsed.dialIso) return 'Select a country code.';
  if (!parsed.nationalNumber) return 'WhatsApp number is required.';

  return validateMobileNational(parsed.nationalNumber, parsed.dialIso, { complete: true });
}

export function validateOptionalPhoneNumber(value: string, preferredDialIso?: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = parseWhatsapp(trimmed, preferredDialIso);
  if (!parsed.dialIso) return 'Select a country code for the phone number.';
  if (!parsed.nationalNumber) return 'Enter a valid mobile number.';

  return validateMobileNational(parsed.nationalNumber, parsed.dialIso, { complete: true });
}
