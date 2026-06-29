import type { EmailTemplateClassification } from '@/lib/email-template-types';

export const EMAIL_BRAND_NAME = 'Slow Burn Method';
export const EMAIL_WEBSITE_URL = 'https://slowburnmethod.in';

/** Resend sender defaults — keep in sync with sbm-backend/internal/resend/sender.go */
export const EMAIL_FROM_DEFAULTS = {
  marketing: {
    name: 'Slow Burn Method',
    localPart: 'hello',
    domain: 'updates.slowburnmethod.in',
  },
  transactional: {
    name: 'Slow Burn Method',
    localPart: 'team',
    domain: 'notify.slowburnmethod.in',
  },
} as const;

export function formatEmailFromAddress(
  classification: EmailTemplateClassification,
  fromName?: string | null,
  fromLocalPart?: string | null
): string {
  const defaults = EMAIL_FROM_DEFAULTS[classification];
  const name = fromName?.trim() || defaults.name;
  const localPart = fromLocalPart?.trim().toLowerCase() || defaults.localPart;
  return `${name} <${localPart}@${defaults.domain}>`;
}

/** @deprecated Use formatEmailFromAddress instead */
export const EMAIL_FROM_ADDRESSES = {
  marketing: formatEmailFromAddress('marketing'),
  transactional: formatEmailFromAddress('transactional'),
} as const;

export function emailFromDomain(classification: EmailTemplateClassification): string {
  return EMAIL_FROM_DEFAULTS[classification].domain;
}

export function emailFromLocalPartPlaceholder(classification: EmailTemplateClassification): string {
  return EMAIL_FROM_DEFAULTS[classification].localPart;
}

export function emailFromNamePlaceholder(): string {
  return EMAIL_FROM_DEFAULTS.marketing.name;
}

/** Full wordmark — prod Supabase public storage (same staging + production). */
export const EMAIL_LOGO_URL = 'https://jnygsverljnvjmyairag.supabase.co/storage/v1/object/public/static/sbm-logo.png';

export function normalizeEmailLocalPart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9._-]/g, '');
}
