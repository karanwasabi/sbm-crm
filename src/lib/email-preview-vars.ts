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
