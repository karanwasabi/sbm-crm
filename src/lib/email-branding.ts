export const EMAIL_BRAND_NAME = 'Slow Burn Method';
export const EMAIL_WEBSITE_URL = 'https://slowburnmethod.in';

/** Resend sender addresses — keep in sync with sbm-backend/internal/resend/addresses.go */
export const EMAIL_FROM_ADDRESSES = {
  marketing: 'Slow Burn Method <hello@updates.slowburnmethod.in>',
  transactional: 'Slow Burn Method <team@notify.slowburnmethod.in>',
} as const;

/** Full wordmark — prod Supabase public storage (same staging + production). */
export const EMAIL_LOGO_URL = 'https://jnygsverljnvjmyairag.supabase.co/storage/v1/object/public/static/sbm-logo.png';
