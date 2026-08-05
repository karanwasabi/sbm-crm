/** Sample values for in-app preview only — real sends substitute on the backend. */
export const EMAIL_PREVIEW_SAMPLE_VARS: Record<string, string> = {
  '{{lead.first_name}}': 'Priya',
  '{{lead.last_name}}': 'Sharma',
  '{{lead.full_name}}': 'Priya Sharma',
  '{{lead.email}}': 'priya.sharma@example.com',
  '{{lead.city}}': 'Mumbai',
  '{{lead.country}}': 'India',
  '{{lead.program_interest}}': 'Take Control',
  '{{lead.batch}}': 'Cohort 12',
  '{{referrer.first_name}}': 'Ananya',
  '{{referrer.last_name}}': 'Kapoor',
  '{{referrer.full_name}}': 'Ananya Kapoor',
  '{{referrer.email}}': 'ananya.kapoor@example.com',
  '{{member.program_name}}': 'Take Control',
  '{{member.cohort_name}}': 'Cohort 12',
  '{{member.cohort_starts_on}}': '3 July 2026',
  '{{member.enrollment_status}}': 'Currently enrolled',
  '{{member.access_until}}': '19 Aug 2026',
  '{{renewal.category}}': 'trial_extend',
  '{{renewal.category_label}}': 'Trial extension',
  '{{renewal.plan_key}}': 'renewal_6m',
  '{{renewal.plan_label}}': '6 month renewal',
  '{{renewal.access_until}}': '2026-08-19T00:00:00Z',
  '{{renewal.access_until_label}}': '19 Aug 2026',
  '{{renewal.cohort_name}}': 'Cohort 12',
  '{{renewal.program_name}}': 'Take Control',
  '{{renewal.amount}}': '₹7,499',
  '{{renewal.months}}': '6',
  '{{renewal.discount_label}}': '17% off',
  '{{renewal.promo_code}}': 'WELCOME15',
  '{{links.portal}}': 'https://portal.slowburnmethod.in',
  '{{links.website}}': 'https://slowburnmethod.in',
  '{{links.unsubscribe}}': 'https://portal.slowburnmethod.in/unsubscribe?token=preview',
};

export function substitutePreviewVariables(
  input: string,
  vars: Record<string, string> = EMAIL_PREVIEW_SAMPLE_VARS
): string {
  let out = input;
  for (const [token, value] of Object.entries(vars)) {
    out = out.split(token).join(value);
  }
  return out;
}
