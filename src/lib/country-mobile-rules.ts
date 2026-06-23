import { Metadata } from 'libphonenumber-js/core';
import type { CountryCode } from 'libphonenumber-js/mobile';
import mobileMetadata from 'libphonenumber-js/mobile/metadata';

export type MobileDigitLimits = {
  min: number;
  max: number;
};

const DEFAULT_LIMITS: MobileDigitLimits = { min: 7, max: 11 };

const phoneMetadata = new Metadata(mobileMetadata);

type PhoneNumberType = 'MOBILE' | 'FIXED_LINE_OR_MOBILE';

type NumberingPlanWithTypes = {
  type?(name: PhoneNumberType): { possibleLengths(): number[] } | undefined;
  possibleLengths(): number[];
};

function asCountryCode(iso: string): CountryCode | null {
  const code = iso.trim().toUpperCase();
  if (code.length !== 2) return null;
  return code as CountryCode;
}

function getMobilePossibleLengths(country: CountryCode): number[] | null {
  phoneMetadata.selectNumberingPlan(country);
  const plan = phoneMetadata.numberingPlan as NumberingPlanWithTypes | undefined;
  if (!plan) return null;

  const mobile = plan.type?.('MOBILE')?.possibleLengths();
  if (mobile?.length) return mobile;

  const fixedOrMobile = plan.type?.('FIXED_LINE_OR_MOBILE')?.possibleLengths();
  if (fixedOrMobile?.length) return fixedOrMobile;

  const national = plan.possibleLengths?.();
  return national?.length ? national : null;
}

export function getMobileDigitLimits(iso: string): MobileDigitLimits {
  const country = asCountryCode(iso);
  if (!country) return DEFAULT_LIMITS;

  try {
    const lengths = getMobilePossibleLengths(country);
    if (!lengths?.length) return DEFAULT_LIMITS;
    return { min: Math.min(...lengths), max: Math.max(...lengths) };
  } catch {
    return DEFAULT_LIMITS;
  }
}

function formatDigitRangeMessage(limits: MobileDigitLimits): string {
  if (limits.min === limits.max) {
    return `Enter ${limits.max} digits without the country code.`;
  }
  return `Enter ${limits.min}–${limits.max} digits without the country code.`;
}

export function getMobileDigitHint(iso: string): string | null {
  if (!iso) return null;
  return formatDigitRangeMessage(getMobileDigitLimits(iso));
}

/**
 * Normalises national mobile input: digits only. Does not truncate or rewrite —
 * length errors are surfaced in the UI instead.
 */
export function sanitizeNationalDigits(raw: string, _dialIso: string): string {
  return raw.replace(/\D/g, '');
}

export function validateMobileNational(nationalDigits: string, dialIso: string): string | null {
  if (!nationalDigits) return null;
  if (!dialIso) return 'Select a country code.';

  const limits = getMobileDigitLimits(dialIso);
  const rangeMessage = formatDigitRangeMessage(limits);

  if (nationalDigits.length > limits.max) {
    return rangeMessage;
  }
  if (nationalDigits.length < limits.min) {
    return null;
  }

  return null;
}
