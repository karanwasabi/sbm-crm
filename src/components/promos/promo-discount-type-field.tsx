'use client';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import type { PromoDiscountType } from '@/lib/promo-discount';

type PromoDiscountTypeFieldProps = {
  value: PromoDiscountType;
  onChange: (value: PromoDiscountType) => void;
  disabled?: boolean;
};

export function PromoDiscountTypeField({ value, onChange, disabled }: PromoDiscountTypeFieldProps) {
  return (
    <Field label="Discount type">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={value === 'percent' ? 'primary' : 'light'}
          size="sm"
          disabled={disabled}
          onClick={() => onChange('percent')}
        >
          Percent off
        </Button>
        <Button
          type="button"
          variant={value === 'fixed' ? 'primary' : 'light'}
          size="sm"
          disabled={disabled}
          onClick={() => onChange('fixed')}
        >
          Flat ₹ off
        </Button>
      </div>
    </Field>
  );
}
