/** Sample values for in-app preview only — real sends substitute on the backend. */
export const EMAIL_PREVIEW_SAMPLE_VARS: Record<string, string> = {
  '{{lead.first_name}}': 'Priya',
  '{{lead.last_name}}': 'Sharma',
  '{{lead.email}}': 'priya.sharma@example.com',
  '{{lead.city}}': 'Mumbai',
  '{{lead.program_interest}}': 'Take Control',
  '{{member.program_name}}': 'Take Control',
  '{{member.cohort_name}}': 'Cohort 12',
  '{{links.portal}}': 'https://portal.slowburnmethod.in',
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
