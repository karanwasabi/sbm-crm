export type PromoDiscountType = 'percent' | 'fixed';

const PERCENT_STORED_SCALE = 100;

function formatDecimalInputValue(num: number): string {
  if (!Number.isFinite(num)) return '';
  return String(Math.round(num * 100) / 100);
}

function sanitizeDecimalFormInput(raw: string, maxDecimals: number, maxValue?: number): string {
  let next = raw.replace(/[^\d.]/g, '');
  const dotIndex = next.indexOf('.');
  if (dotIndex !== -1) {
    const whole = next.slice(0, dotIndex);
    const fraction = next
      .slice(dotIndex + 1)
      .replace(/\./g, '')
      .slice(0, maxDecimals);
    if (raw.endsWith('.') && fraction.length === 0) {
      next = `${whole}.`;
    } else if (fraction.length > 0) {
      next = `${whole}.${fraction}`;
    } else {
      next = whole;
    }
  }
  if (next === '0') return '';
  if (maxValue != null && next !== '' && !next.endsWith('.')) {
    const num = Number(next);
    if (Number.isFinite(num) && num > maxValue) {
      return formatDecimalInputValue(maxValue);
    }
  }
  return next;
}

export function formatPromoDiscount(
  discountType: string | undefined,
  discountValue: number | null | undefined
): string {
  if (discountValue == null || !discountType) return '—';
  if (discountType === 'percent') {
    const percent = discountValue / PERCENT_STORED_SCALE;
    const formatted = new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(percent);
    return `${formatted}% off`;
  }
  return `₹${(discountValue / 100).toLocaleString('en-IN')} off`;
}

export function formatPromoDiscountFromSnapshot(snapshot: Record<string, unknown>): string {
  const discountType = typeof snapshot.discount_type === 'string' ? snapshot.discount_type : undefined;
  const discountValue = typeof snapshot.discount_value === 'number' ? snapshot.discount_value : null;
  return formatPromoDiscount(discountType, discountValue);
}

export function promoDiscountFieldLabel(discountType: string | undefined): string {
  if (discountType === 'fixed') return 'Discount (₹)';
  return 'Discount (%)';
}

export function promoDiscountFieldHint(discountType: PromoDiscountType): string | undefined {
  if (discountType === 'percent') return 'Values from 1% to 100%, with up to two decimal places.';
  return 'Must be greater than zero.';
}

export function sanitizePromoDiscountFormInput(discountType: PromoDiscountType, raw: string): string {
  if (discountType === 'percent') {
    return sanitizeDecimalFormInput(raw, 2, 100);
  }
  return sanitizeDecimalFormInput(raw, 2);
}

export function normalizePromoDiscountFormInput(discountType: PromoDiscountType, raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  const num = Number(trimmed);
  if (!Number.isFinite(num)) return '';

  if (discountType === 'percent') {
    const clamped = Math.min(100, Math.max(1, Math.round(num * 100) / 100));
    return formatDecimalInputValue(clamped);
  }

  if (num <= 0) return '';
  return formatDecimalInputValue(num);
}

export function promoDiscountToFormValue(
  discountType: string | undefined,
  storedValue: number | null | undefined
): string {
  if (storedValue == null) return '';
  if (discountType === 'fixed') return formatDecimalInputValue(storedValue / 100);
  return formatDecimalInputValue(storedValue / PERCENT_STORED_SCALE);
}

export function promoDiscountFromFormValue(discountType: string | undefined, formValue: number): number {
  if (discountType === 'fixed') return Math.round(formValue * 100);
  return Math.round(formValue * PERCENT_STORED_SCALE);
}

export function validatePromoDiscountFormValue(discountType: PromoDiscountType, formValue: number): string | null {
  if (!Number.isFinite(formValue)) return 'Enter a valid discount.';
  if (discountType === 'percent') {
    if (formValue < 1 || formValue > 100) return 'Percent discount must be between 1% and 100%.';
    return null;
  }
  if (formValue <= 0) return 'Discount must be positive.';
  return null;
}

export function promoDiscountTypeLabel(discountType: string | undefined): string {
  if (discountType === 'fixed') return 'Flat amount';
  return 'Percent';
}
