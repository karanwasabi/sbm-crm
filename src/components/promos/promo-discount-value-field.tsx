'use client';

import { useState } from 'react';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import {
  normalizePromoDiscountFormInput,
  promoDiscountFieldHint,
  promoDiscountFieldLabel,
  sanitizePromoDiscountFormInput,
  type PromoDiscountType,
} from '@/lib/promo-discount';

type PromoDiscountValueFieldProps = {
  discountType: PromoDiscountType;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
};

function promoDiscountValueError(discountType: PromoDiscountType, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const num = Number(trimmed);
  if (!Number.isFinite(num)) return 'Enter a valid number.';

  if (discountType === 'percent') {
    if (num < 1 || num > 100) return 'Enter a percentage between 1 and 100.';
    return null;
  }

  if (num <= 0) return 'Amount must be greater than zero.';
  return null;
}

export function PromoDiscountValueField({
  discountType,
  value,
  onChange,
  disabled,
  className,
}: PromoDiscountValueFieldProps) {
  const [touched, setTouched] = useState(false);
  const error = touched ? promoDiscountValueError(discountType, value) : null;
  const hint = promoDiscountFieldHint(discountType);

  return (
    <Field label={promoDiscountFieldLabel(discountType)} hint={error ? undefined : hint} error={error}>
      <TextInput
        value={value}
        onChange={(next) => onChange(sanitizePromoDiscountFormInput(discountType, next))}
        onBlur={() => {
          setTouched(true);
          onChange(normalizePromoDiscountFormInput(discountType, value));
        }}
        inputMode="decimal"
        type="number"
        min={discountType === 'percent' ? 1 : 0.01}
        max={discountType === 'percent' ? 100 : undefined}
        step={0.01}
        disabled={disabled}
        className={className}
        error={Boolean(error)}
      />
    </Field>
  );
}
