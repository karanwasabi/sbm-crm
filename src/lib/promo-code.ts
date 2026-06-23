const PROMO_CODE_DISALLOWED = /[^A-Z0-9_-]/g;
const PROMO_CODE_PATTERN = /^[A-Z0-9_-]+$/;

export const PROMO_CODE_CHAR_HINT = 'Letters, numbers, hyphens, and underscores only.';

export function normalizePromoCodeInput(value: string): string {
  return value.toUpperCase().replace(PROMO_CODE_DISALLOWED, '');
}

export function normalizePromoCode(value: string): string {
  return normalizePromoCodeInput(value.trim());
}

export function isValidPromoCode(value: string): boolean {
  const normalized = normalizePromoCode(value);
  return normalized.length > 0 && PROMO_CODE_PATTERN.test(normalized);
}

export const promoCodeInputProps = {
  autoCapitalize: 'characters' as const,
  autoCorrect: 'off' as const,
  spellCheck: false,
  className: 'uppercase',
};
