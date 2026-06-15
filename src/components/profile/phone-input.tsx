'use client';

import { Phone } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DialCodePicker } from '@/components/profile/dial-code-picker';
import { TextInput } from '@/components/ui/text-input';
import { getMobileDigitHint, sanitizeNationalDigits, validateMobileNational } from '@/lib/country-mobile-rules';
import { getCountryDialCode } from '@/lib/country-dial-codes';
import { combineWhatsapp, parseWhatsapp } from '@/lib/phone-number';
import { cn } from '@/lib/utils';
import type { Country } from '@/types/reference';

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  countries: Country[];
  /** When the combined number is blank, auto-fill dial code from this country. */
  suggestedCountryIso?: string;
  /** Bumped to force internal state to re-sync from `value` (e.g. form discard). */
  syncToken?: number;
  name?: string;
  disabled?: boolean;
  className?: string;
};

function initialParts(value: string, suggestedCountryIso?: string) {
  const parsed = parseWhatsapp(value, suggestedCountryIso);
  if (!value.trim() && suggestedCountryIso) {
    const dial = getCountryDialCode(suggestedCountryIso);
    if (dial) {
      return { dialCode: dial, dialIso: suggestedCountryIso, nationalNumber: '' };
    }
  }
  if (parsed.dialIso && parsed.nationalNumber) {
    return {
      ...parsed,
      nationalNumber: sanitizeNationalDigits(parsed.nationalNumber, parsed.dialIso),
    };
  }
  return parsed;
}

function applyValueToParts(
  value: string,
  suggestedCountryIso: string | undefined,
  setters: {
    setDialCode: (v: string) => void;
    setDialIso: (v: string) => void;
    setNationalNumber: (v: string) => void;
  },
  refs: {
    lastEmitted: { current: string };
    lastSuggestedIso: { current: string | undefined };
  }
) {
  refs.lastEmitted.current = value;
  refs.lastSuggestedIso.current = suggestedCountryIso;
  const next = initialParts(value, suggestedCountryIso);
  setters.setDialCode(next.dialCode);
  setters.setDialIso(next.dialIso);
  setters.setNationalNumber(next.nationalNumber);
}

export function PhoneInput({
  value,
  onChange,
  countries,
  suggestedCountryIso,
  syncToken,
  name,
  disabled,
  className,
}: PhoneInputProps) {
  const initial = initialParts(value, suggestedCountryIso);
  const [dialCode, setDialCode] = useState(initial.dialCode);
  const [dialIso, setDialIso] = useState(initial.dialIso);
  const [nationalNumber, setNationalNumber] = useState(initial.nationalNumber);
  const lastEmitted = useRef(value);
  const lastSuggestedIso = useRef(suggestedCountryIso);
  const lastSyncToken = useRef(syncToken);

  useEffect(() => {
    if (syncToken !== undefined && syncToken !== lastSyncToken.current) {
      lastSyncToken.current = syncToken;
      applyValueToParts(
        value,
        suggestedCountryIso,
        { setDialCode, setDialIso, setNationalNumber },
        { lastEmitted, lastSuggestedIso }
      );
      return;
    }

    if (value === lastEmitted.current) {
      if (!value.trim() && suggestedCountryIso && suggestedCountryIso !== lastSuggestedIso.current) {
        lastSuggestedIso.current = suggestedCountryIso;
        const dial = getCountryDialCode(suggestedCountryIso);
        if (dial) {
          setDialCode(dial);
          setDialIso(suggestedCountryIso);
        }
      }
      return;
    }

    // Parent has not applied a clear emit yet; avoid restoring a stale saved number.
    if (!lastEmitted.current.trim() && value.trim()) {
      return;
    }

    lastEmitted.current = value;
    lastSuggestedIso.current = suggestedCountryIso;
    const next = initialParts(value, suggestedCountryIso);
    setDialCode(next.dialCode);
    setDialIso(next.dialIso);
    setNationalNumber(next.nationalNumber);
  }, [value, suggestedCountryIso, syncToken]);

  const digitHint = useMemo(() => getMobileDigitHint(dialIso), [dialIso]);
  const validationError = useMemo(() => {
    if (!nationalNumber) return null;
    return validateMobileNational(nationalNumber, dialIso, dialCode);
  }, [nationalNumber, dialIso, dialCode]);

  const updateCombined = (nextDial: string, nextIso: string, nextNational: string) => {
    const sanitized = nextIso ? sanitizeNationalDigits(nextNational, nextIso) : nextNational.replace(/\D/g, '');
    setDialCode(nextDial);
    setDialIso(nextIso);
    setNationalNumber(sanitized);
    const combined = combineWhatsapp(nextDial, sanitized, nextIso);
    lastEmitted.current = combined;
    onChange(combined);
  };

  const combinedValue = combineWhatsapp(dialCode, nationalNumber, dialIso);

  return (
    <div className={cn('flex items-start gap-2', className)}>
      <DialCodePicker
        dialIso={dialIso}
        onChange={({ dialCode: nextDial, dialIso: nextIso }) => {
          const sanitized = sanitizeNationalDigits(nationalNumber, nextIso);
          updateCombined(nextDial, nextIso, sanitized);
        }}
        countries={countries}
        disabled={disabled}
        className="w-35 shrink-0"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <TextInput
          value={nationalNumber}
          onChange={(nextNational) => {
            updateCombined(dialCode, dialIso, nextNational);
          }}
          placeholder="Mobile number"
          disabled={disabled}
          inputMode="tel"
          autoComplete="tel-national"
          error={Boolean(validationError)}
          leftIcon={<Phone size={16} className="text-slate-400" />}
        />
        <div className="min-h-[18px]">
          <p
            className={cn(
              'pl-0.5 text-[11.5px] leading-[18px]',
              validationError
                ? 'font-semibold text-destructive'
                : digitHint
                  ? 'font-medium text-muted-foreground'
                  : 'invisible'
            )}
            aria-live="polite"
          >
            {validationError ?? digitHint ?? 'Enter digits without the country code.'}
          </p>
        </div>
        {name ? <input type="hidden" name={name} value={combinedValue} /> : null}
      </div>
    </div>
  );
}
