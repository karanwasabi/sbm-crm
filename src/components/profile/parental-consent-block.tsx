'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { PARENTAL_CONSENT_LABEL } from '@/lib/date-of-birth';
import { cn } from '@/lib/cn';

type ParentalConsentBlockProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  error?: boolean;
};

export function ParentalConsentBlock({ checked, onChange, disabled, error }: ParentalConsentBlockProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3.5',
        error ? 'border-danger/40 bg-danger/5' : 'border-brand/25 bg-brand/5'
      )}
      role="group"
      aria-labelledby="parental-consent-heading"
    >
      <p id="parental-consent-heading" className="text-[13px] font-bold text-slate-800">
        Parental consent required
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
        Members aged 13–17 need a parent or legal guardian&apos;s permission to join.
      </p>
      <Checkbox
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={PARENTAL_CONSENT_LABEL}
        className="mt-3"
      />
      {error ? (
        <p className="mt-2 text-[11.5px] font-semibold text-danger-press" role="alert">
          Please confirm parental consent to continue.
        </p>
      ) : null}
    </div>
  );
}
