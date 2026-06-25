export type EmailTemplateClassification = 'transactional' | 'marketing';

export type EmailTemplateStatus = 'draft' | 'active' | 'archived';

export type GrapesProjectData = Record<string, unknown>;

export const EMAIL_VARIABLES = [
  { token: '{{lead.first_name}}', label: 'First name' },
  { token: '{{lead.last_name}}', label: 'Last name' },
  { token: '{{lead.email}}', label: 'Email' },
  { token: '{{lead.city}}', label: 'City' },
  { token: '{{lead.program_interest}}', label: 'Program interest' },
  { token: '{{member.program_name}}', label: 'Program name' },
  { token: '{{member.cohort_name}}', label: 'Cohort name' },
  { token: '{{links.portal}}', label: 'Portal link' },
  { token: '{{links.unsubscribe}}', label: 'Unsubscribe link' },
] as const;

export const MARKETING_CONTACT_STATUS_LABELS: Record<string, string> = {
  not_applicable: 'N/A',
  eligible: 'Eligible',
  active: 'Subscribed',
  no_consent: 'No consent',
  unsubscribed: 'Unsubscribed',
};
