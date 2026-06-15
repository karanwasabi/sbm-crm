import {
  COUNTRY_DIAL_CODES,
  getCountryDialCode,
  normalizeDialCode,
  resolveIsoForDialCode,
} from '@/lib/country-dial-codes';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js/mobile';

export type ParsedPhone = {
  dialCode: string;
  dialIso: string;
  nationalNumber: string;
};

const DIAL_CODES_BY_LENGTH = Object.values(COUNTRY_DIAL_CODES)
  .filter((dial, index, all) => all.indexOf(dial) === index)
  .sort((a, b) => b.length - a.length);

function asCountryCode(iso: string | undefined): CountryCode | null {
  if (!iso) return null;
  const code = iso.trim().toUpperCase();
  if (code.length !== 2) return null;
  return code as CountryCode;
}

export function parseWhatsapp(value: string, preferredIso?: string): ParsedPhone {
  const trimmed = value.trim();
  if (!trimmed) {
    return { dialCode: '', dialIso: '', nationalNumber: '' };
  }

  const compact = trimmed.replace(/[\s().-]/g, '');
  const withPlus = compact.startsWith('+') ? compact : `+${compact.replace(/^\+/, '')}`;

  for (const dial of DIAL_CODES_BY_LENGTH) {
    if (!withPlus.startsWith(dial)) continue;
    const national = withPlus.slice(dial.length).replace(/\D/g, '');
    return {
      dialCode: dial,
      dialIso: resolveIsoForDialCode(dial, preferredIso),
      nationalNumber: national,
    };
  }

  const digitsOnly = compact.replace(/\D/g, '');
  return { dialCode: '', dialIso: '', nationalNumber: digitsOnly };
}

export function combineWhatsapp(dialCode: string, nationalNumber: string, dialIso?: string): string {
  const national = nationalNumber.replace(/\D/g, '');
  if (!national) return '';

  const country = asCountryCode(dialIso);
  if (country) {
    const parsedNational = parsePhoneNumberFromString(national, country);
    if (parsedNational?.isValid()) {
      return parsedNational.format('E.164');
    }
  }

  const dial = normalizeDialCode(dialCode);
  if (!dial) return national;

  if (country) {
    const parsedWithDial = parsePhoneNumberFromString(`${dial}${national}`, country);
    if (parsedWithDial?.isValid()) {
      return parsedWithDial.format('E.164');
    }
  }

  return `${dial}${national}`;
}

export function getDialCodeForCountry(isoCode: string): string {
  return getCountryDialCode(isoCode);
}
